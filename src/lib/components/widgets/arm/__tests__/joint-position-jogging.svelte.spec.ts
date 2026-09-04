import type { ComponentProps } from 'svelte'

import { render, screen, within } from '@testing-library/svelte'
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

	const jogStepSelect = () => screen.getByRole('combobox', { name: /jog step/iu })

	const increaseButton = (jointIndex: number, degrees: number) =>
		screen.getByRole('button', { name: `Increase joint ${jointIndex} by ${degrees} degrees` })

	const row = (jointIndex: number) => screen.getAllByRole('listitem')[jointIndex]!

	const rowStatus = (jointIndex: number) => within(row(jointIndex)).getByRole('status')

	it('defaults the jog step to 5 degrees', () => {
		renderSubject()

		expect(jogStepSelect()).toHaveValue('5')
		expect(increaseButton(0, 5)).toHaveTextContent('+5°')
	})

	it('labels each joint and shows its current position', () => {
		renderSubject({ positions: [12, -4.5] })

		const rows = screen.getAllByRole('listitem')
		expect(rows).toHaveLength(2)
		expect(rows[0]).toHaveTextContent('Joint 0')
		expect(rows[0]).toHaveTextContent('12.00°')
		expect(rows[1]).toHaveTextContent('Joint 1')
		expect(rows[1]).toHaveTextContent('-4.50°')
	})

	it('explains tapping and holding on each jog button', () => {
		renderSubject()

		expect(screen.getByText('Tap or hold to add 5°')).toBeInTheDocument()
		expect(screen.getByText('Tap or hold to subtract 5°')).toBeInTheDocument()
	})

	it('offers 1, 5, 10, and 15 degree jog steps', () => {
		renderSubject()

		const labels = screen.getAllByRole('option').map((option) => option.textContent?.trim())
		expect(labels).toEqual(['1°', '5°', '10°', '15°'])
	})

	it('jogs by the selected amount', async () => {
		const moveToJointPositions = vi.fn().mockResolvedValue(undefined)
		renderSubject({ positions: [10], moveToJointPositions })

		await user.selectOptions(jogStepSelect(), '10')
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

	it('keeps adding while a button is held and shows the expected position in the row', async () => {
		const moveToJointPositions = vi.fn().mockResolvedValue(undefined)
		renderSubject({ positions: [30], moveToJointPositions })

		await user.pointer({ target: increaseButton(0, 5), keys: '[MouseLeft>]' })
		expect(rowStatus(0)).toHaveTextContent('Joint 0 will move to 35.00°')

		vi.advanceTimersByTime(timing.holdRepeatDelayMs + timing.holdRepeatIntervalMs * 2)
		await tick()
		expect(rowStatus(0)).toHaveTextContent('Joint 0 will move to 45.00°')
		expect(moveToJointPositions).not.toHaveBeenCalled()

		await user.pointer({ keys: '[/MouseLeft]' })
		vi.advanceTimersByTime(timing.sendDebounceMs)

		expect(moveToJointPositions).toHaveBeenCalledTimes(1)
		expect(moveToJointPositions).toHaveBeenCalledWith([45])
	})

	it('shows the expected position in radians when the toggle is on', async () => {
		renderSubject({ positions: [90], useRadians: true })

		await user.click(increaseButton(0, 5))

		expect(rowStatus(0)).toHaveTextContent('Joint 0 will move to 1.66 rad')
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

		expect(within(rowStatus(0)).getByLabelText('Progress spinner')).toBeInTheDocument()
		expect(rowStatus(0)).toHaveTextContent('Moving joint 0 to 5.00°')
		expect(increaseButton(0, 5)).toBeDisabled()

		resolveMove()
		await vi.advanceTimersByTimeAsync(0)
		await tick()

		expect(screen.queryByLabelText('Progress spinner')).not.toBeInTheDocument()
		expect(rowStatus(0)).toHaveTextContent('Joint 0 moved to 5.00°')
		expect(increaseButton(0, 5)).not.toBeDisabled()

		vi.advanceTimersByTime(timing.resultDisplayMs)
		await tick()
		expect(within(row(0)).queryByRole('status')).not.toBeInTheDocument()
		expect(row(0)).toHaveTextContent('0.00°')
	})

	it('reports a failed move', async () => {
		const moveToJointPositions = vi.fn().mockRejectedValue(new Error('arm offline'))
		renderSubject({ moveToJointPositions })

		await user.click(increaseButton(0, 5))
		await vi.advanceTimersByTimeAsync(timing.sendDebounceMs)
		await tick()

		expect(rowStatus(0)).toHaveTextContent('Move of joint 0 to 5.00° failed')
	})

	it('does not queue while the arm is moving', async () => {
		const moveToJointPositions = vi.fn().mockResolvedValue(undefined)
		renderSubject({ moveToJointPositions, isMoving: true })

		const button = increaseButton(0, 5)
		expect(button).toBeDisabled()

		await user.click(button)
		vi.advanceTimersByTime(timing.sendDebounceMs)

		expect(moveToJointPositions).not.toHaveBeenCalled()
		expect(within(row(0)).queryByRole('status')).not.toBeInTheDocument()
	})

	it('keeps the badge of the first joint while a second joint is jogged', async () => {
		const resolvers: (() => void)[] = []
		const moveToJointPositions = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					resolvers.push(resolve)
				})
		)
		renderSubject({ positions: [0, 0], moveToJointPositions })

		await user.click(increaseButton(0, 5))
		vi.advanceTimersByTime(timing.sendDebounceMs)
		await tick()
		expect(rowStatus(0)).toHaveTextContent('Moving joint 0 to 5.00°')
		expect(increaseButton(0, 5)).toBeDisabled()
		expect(increaseButton(1, 5)).not.toBeDisabled()

		await user.click(increaseButton(1, 5))
		expect(rowStatus(0)).toHaveTextContent('Moving joint 0 to 5.00°')
		expect(rowStatus(1)).toHaveTextContent('Joint 1 will move to 5.00°')

		vi.advanceTimersByTime(timing.sendDebounceMs)
		expect(moveToJointPositions).toHaveBeenCalledTimes(2)
		expect(moveToJointPositions).toHaveBeenNthCalledWith(1, [5, 0])
		expect(moveToJointPositions).toHaveBeenNthCalledWith(2, [5, 5])

		for (const resolve of resolvers) resolve()
		await vi.advanceTimersByTimeAsync(0)
		await tick()
		expect(rowStatus(0)).toHaveTextContent('Joint 0 moved to 5.00°')
		expect(rowStatus(1)).toHaveTextContent('Joint 1 moved to 5.00°')
	})
})
