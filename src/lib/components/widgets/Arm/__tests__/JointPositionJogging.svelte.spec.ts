import type { ComponentProps } from 'svelte'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../JointPositionJogging.svelte'
import { DEFAULT_JOG_QUEUE_TIMING } from '../useJogQueue.svelte'

const timing = DEFAULT_JOG_QUEUE_TIMING
const TOOLTIP_OPEN_DELAY_MS = 300

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
			jointLimitsDegrees: [],
			moveToJointPositions: vi.fn().mockResolvedValue(undefined),
			useRadians: false,
			isMoving: false,
			...props,
		})

	const jogStepSelect = () => screen.getByRole('combobox', { name: /jog step/iu })

	const chooseJogStep = async (label: string) => {
		await user.click(jogStepSelect())
		await user.click(await screen.findByRole('option', { name: label }))
	}

	const increaseButton = (jointIndex: number, degrees: number) =>
		screen.getByRole('button', { name: `Joint ${jointIndex}, plus ${degrees} degrees` })

	const row = (jointIndex: number) => screen.getAllByRole('listitem')[jointIndex]!

	const rowStatus = (jointIndex: number) => within(row(jointIndex)).getByRole('status')

	it('defaults the jog step to 5 degrees', () => {
		renderSubject()

		expect(jogStepSelect()).toHaveTextContent('5°')
		expect(increaseButton(0, 5)).toMatchTextContent('+5°')
	})

	it('labels each joint and shows its current position', () => {
		renderSubject({ positions: [12, -4.5] })

		const rows = screen.getAllByRole('listitem')
		expect(rows).toHaveLength(2)
		expect(rows[0]).toMatchTextContent('Joint 0')
		expect(rows[0]).toMatchTextContent('12.00°')
		expect(rows[1]).toMatchTextContent('Joint 1')
		expect(rows[1]).toMatchTextContent('-4.50°')
	})

	it('explains tapping and holding in the About jogging tooltip', async () => {
		renderSubject()

		await user.hover(screen.getByRole('button', { name: 'About jogging' }))
		await vi.advanceTimersByTimeAsync(TOOLTIP_OPEN_DELAY_MS)

		const tooltip = await screen.findByRole('tooltip')
		expect(tooltip.textContent).toContain('Tap or hold a jog button to step its joint.')
	})

	it('offers 1, 5, 10, and 15 degree jog steps', async () => {
		renderSubject()

		await user.click(jogStepSelect())

		const options = await screen.findAllByRole('option')
		const labels = options.map((option) => option.textContent?.trim())
		expect(labels).toEqual(['1°', '5°', '10°', '15°'])
	})

	it('jogs by the selected amount', async () => {
		const moveToJointPositions = vi.fn().mockResolvedValue(undefined)
		renderSubject({ positions: [10], moveToJointPositions })

		await chooseJogStep('10°')
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
		expect(rowStatus(0)).toMatchTextContent('Joint 0 will move to 35.00°')

		vi.advanceTimersByTime(timing.holdRepeatDelayMs + timing.holdRepeatIntervalMs * 2)
		await tick()
		expect(rowStatus(0)).toMatchTextContent('Joint 0 will move to 45.00°')
		expect(moveToJointPositions).not.toHaveBeenCalled()

		await user.pointer({ keys: '[/MouseLeft]' })
		vi.advanceTimersByTime(timing.sendDebounceMs)

		expect(moveToJointPositions).toHaveBeenCalledTimes(1)
		expect(moveToJointPositions).toHaveBeenCalledWith([45])
	})

	it('shows the expected position in radians when the toggle is on', async () => {
		renderSubject({ positions: [90], useRadians: true })

		await user.click(increaseButton(0, 5))

		expect(rowStatus(0)).toMatchTextContent('Joint 0 will move to 1.66 rad')
	})

	it('clamps the jog to the joint limit and shows the clamped target', async () => {
		const moveToJointPositions = vi.fn().mockResolvedValue(undefined)
		renderSubject({
			positions: [350],
			jointLimitsDegrees: [{ minDegrees: -360, maxDegrees: 360 }],
			moveToJointPositions,
		})

		await chooseJogStep('15°')
		await user.click(increaseButton(0, 15))

		expect(rowStatus(0)).toMatchTextContent('Joint 0 will move to 360.00°')

		vi.advanceTimersByTime(timing.sendDebounceMs)
		expect(moveToJointPositions).toHaveBeenCalledWith([360])
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

	it('reports the move while it is in flight, then once it lands', async () => {
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

		expect(rowStatus(0)).toMatchTextContent('Moving joint 0 to 5.00°')
		expect(increaseButton(0, 5)).toBeDisabled()

		resolveMove()
		await vi.advanceTimersByTimeAsync(0)
		await tick()

		expect(rowStatus(0)).toMatchTextContent('Joint 0 moved to 5.00°')
		expect(increaseButton(0, 5)).not.toBeDisabled()

		vi.advanceTimersByTime(timing.resultDisplayMs)
		await tick()
		expect(rowStatus(0)).toBeEmptyDOMElement()
		expect(row(0)).toMatchTextContent('0.00°')
	})

	it('reports a failed move', async () => {
		const moveToJointPositions = vi.fn().mockRejectedValue(new Error('arm offline'))
		renderSubject({ moveToJointPositions })

		await user.click(increaseButton(0, 5))
		await vi.advanceTimersByTimeAsync(timing.sendDebounceMs)
		await tick()

		expect(rowStatus(0)).toMatchTextContent('Move of joint 0 to 5.00° failed')
	})

	it('does not queue while the arm is moving', async () => {
		const moveToJointPositions = vi.fn().mockResolvedValue(undefined)
		renderSubject({ moveToJointPositions, isMoving: true })

		const button = increaseButton(0, 5)
		expect(button).toBeDisabled()

		await user.click(button)
		vi.advanceTimersByTime(timing.sendDebounceMs)

		expect(moveToJointPositions).not.toHaveBeenCalled()
		expect(rowStatus(0)).toBeEmptyDOMElement()
	})

	it('keeps an empty status in every idle row, so the first step is announced', () => {
		renderSubject({ positions: [0, 0, 0] })

		const statuses = screen.getAllByRole('status')
		expect(statuses).toHaveLength(3)
		expect(statuses.filter((status) => status.textContent?.trim() !== '')).toEqual([])
	})

	it('marks a sending step with progress dots and a queued step without them', async () => {
		const moveToJointPositions = vi.fn(() => new Promise<void>(() => {}))
		renderSubject({ positions: [0, 0], moveToJointPositions })

		await user.click(increaseButton(0, 5))
		vi.advanceTimersByTime(timing.sendDebounceMs)
		await tick()
		await user.click(increaseButton(1, 5))

		expect(rowStatus(0).querySelector('.badge-pending .progress-dots')).toBeInTheDocument()
		expect(rowStatus(1).querySelector('.badge-pending')).toBeInTheDocument()
		expect(rowStatus(1).querySelector('.progress-dots')).not.toBeInTheDocument()
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
		expect(rowStatus(0)).toMatchTextContent('Moving joint 0 to 5.00°')
		expect(increaseButton(0, 5)).toBeDisabled()
		expect(increaseButton(1, 5)).not.toBeDisabled()

		await user.click(increaseButton(1, 5))
		expect(rowStatus(0)).toMatchTextContent('Moving joint 0 to 5.00°')
		expect(rowStatus(1)).toMatchTextContent('Joint 1 will move to 5.00°')

		vi.advanceTimersByTime(timing.sendDebounceMs)
		expect(moveToJointPositions).toHaveBeenCalledTimes(2)
		expect(moveToJointPositions).toHaveBeenNthCalledWith(1, [5, 0])
		expect(moveToJointPositions).toHaveBeenNthCalledWith(2, [5, 5])

		for (const resolve of resolvers) resolve()
		await vi.advanceTimersByTimeAsync(0)
		await tick()
		expect(rowStatus(0)).toMatchTextContent('Joint 0 moved to 5.00°')
		expect(rowStatus(1)).toMatchTextContent('Joint 1 moved to 5.00°')
	})
})
