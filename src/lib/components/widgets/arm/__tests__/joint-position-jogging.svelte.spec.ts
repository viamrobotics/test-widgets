import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../joint-position-jogging.svelte'
import { DEFAULT_JOG_QUEUE_TIMING } from '../useJogQueue.svelte'

const timing = DEFAULT_JOG_QUEUE_TIMING

describe('Arm joint-position-jogging', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		vi.useFakeTimers()
		user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>> = {}) =>
		render(Subject, {
			positions: [0],
			moveToJointPositions: vi.fn().mockResolvedValue(undefined),
			useRadians: false,
			isMoving: false,
			...props,
		})

	const jogAmountSelect = () => screen.getByRole('combobox', { name: /jog amount/iu })

	const increaseButton = (jointIndex: number, degrees: number) =>
		screen.getByRole('button', { name: `Increase joint ${jointIndex} by ${degrees} degrees` })

	const popoverText = (text: string) =>
		screen.getAllByText(text).filter((element) => element.closest('[role="tooltip"]'))

	it('defaults the jog amount to 5 degrees', () => {
		renderSubject()

		expect(jogAmountSelect()).toHaveValue('5')
		expect(increaseButton(0, 5)).toHaveTextContent('+5°')
	})

	it('offers 1, 5, 10, and 15 degree jog amounts', () => {
		renderSubject()

		const labels = screen.getAllByRole('option').map((option) => option.textContent?.trim())
		expect(labels).toEqual(['1°', '5°', '10°', '15°'])
	})

	it('jogs by the selected amount', async () => {
		const moveToJointPositions = vi.fn().mockResolvedValue(undefined)
		renderSubject({ positions: [10], moveToJointPositions })

		await user.selectOptions(jogAmountSelect(), '10')
		await user.click(increaseButton(0, 10))
		vi.advanceTimersByTime(timing.sendDebounceMs)

		expect(moveToJointPositions).toHaveBeenCalledWith([20])
	})

	it('adds rapid presses into a single move', async () => {
		const moveToJointPositions = vi.fn().mockResolvedValue(undefined)
		renderSubject({ moveToJointPositions })

		const button = increaseButton(0, 5)
		await user.click(button)
		await user.click(button)
		await user.click(button)
		expect(moveToJointPositions).not.toHaveBeenCalled()

		vi.advanceTimersByTime(timing.sendDebounceMs)

		expect(moveToJointPositions).toHaveBeenCalledTimes(1)
		expect(moveToJointPositions).toHaveBeenCalledWith([15])
	})

	it('keeps adding while a button is held and shows the queued total above it', async () => {
		const moveToJointPositions = vi.fn().mockResolvedValue(undefined)
		renderSubject({ moveToJointPositions })

		await user.pointer({ target: increaseButton(0, 5), keys: '[MouseLeft>]' })
		expect(popoverText('+5°')).toHaveLength(1)
		expect(screen.getByText('Queued +5° for joint 0')).toBeInTheDocument()

		vi.advanceTimersByTime(timing.holdRepeatDelayMs + timing.holdRepeatIntervalMs * 2)
		await tick()
		expect(popoverText('+15°')).toHaveLength(1)
		expect(moveToJointPositions).not.toHaveBeenCalled()

		await user.pointer({ keys: '[/MouseLeft]' })
		vi.advanceTimersByTime(timing.sendDebounceMs)

		expect(moveToJointPositions).toHaveBeenCalledTimes(1)
		expect(moveToJointPositions).toHaveBeenCalledWith([15])
	})

	it('queues from a keyboard activation', async () => {
		const moveToJointPositions = vi.fn().mockResolvedValue(undefined)
		renderSubject({ moveToJointPositions })

		increaseButton(0, 5).focus()
		await user.keyboard('{Enter}')
		vi.advanceTimersByTime(timing.sendDebounceMs)

		expect(moveToJointPositions).toHaveBeenCalledTimes(1)
		expect(moveToJointPositions).toHaveBeenCalledWith([5])
	})

	it('shows a spinner while the move is in flight, then a check', async () => {
		let resolveMove = () => {}
		const moveToJointPositions = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					resolveMove = resolve
				})
		)
		renderSubject({ moveToJointPositions })

		await user.click(increaseButton(0, 5))
		vi.advanceTimersByTime(timing.sendDebounceMs)
		await tick()

		expect(screen.getByLabelText('Progress spinner')).toBeInTheDocument()
		expect(screen.getByText('Sending +5° to joint 0')).toBeInTheDocument()
		expect(increaseButton(0, 5)).toBeDisabled()

		resolveMove()
		await vi.advanceTimersByTimeAsync(0)
		await tick()

		expect(screen.queryByLabelText('Progress spinner')).not.toBeInTheDocument()
		expect(screen.getByText('Moved joint 0 by +5°')).toBeInTheDocument()
		expect(increaseButton(0, 5)).not.toBeDisabled()

		vi.advanceTimersByTime(timing.resultDisplayMs)
		await tick()
		expect(screen.queryByText('Moved joint 0 by +5°')).not.toBeInTheDocument()
	})

	it('reports a failed move', async () => {
		const moveToJointPositions = vi.fn().mockRejectedValue(new Error('arm offline'))
		renderSubject({ moveToJointPositions })

		await user.click(increaseButton(0, 5))
		await vi.advanceTimersByTimeAsync(timing.sendDebounceMs)
		await tick()

		expect(screen.getByText('Move of +5° on joint 0 failed')).toBeInTheDocument()
	})

	it('does not queue while the arm is moving', async () => {
		const moveToJointPositions = vi.fn().mockResolvedValue(undefined)
		renderSubject({ moveToJointPositions, isMoving: true })

		const button = increaseButton(0, 5)
		expect(button).toBeDisabled()

		await user.click(button)
		vi.advanceTimersByTime(timing.sendDebounceMs)

		expect(moveToJointPositions).not.toHaveBeenCalled()
		expect(screen.queryByText(/queued/iu)).not.toBeInTheDocument()
	})

	it('sends the pending joint when another joint is pressed', async () => {
		const moveToJointPositions = vi.fn().mockResolvedValue(undefined)
		renderSubject({ positions: [0, 0], moveToJointPositions })

		await user.click(increaseButton(0, 5))
		await user.click(increaseButton(1, 5))
		expect(moveToJointPositions).toHaveBeenCalledWith([5, 0])

		vi.advanceTimersByTime(timing.sendDebounceMs)
		expect(moveToJointPositions).toHaveBeenCalledWith([0, 5])
	})
})
