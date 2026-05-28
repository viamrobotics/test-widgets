import type { ComponentProps } from 'svelte'

import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { JointLimit } from '../joint-position-limits'

import Subject from '../move-to-joint-positions.svelte'

const jointLimitsForCount = (
	count: number,
	limit: JointLimit = { minDegrees: -180, maxDegrees: 180 }
): JointLimit[] => Array.from({ length: count }, () => ({ ...limit }))

describe('Arm move-to-joint-positions', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) => {
		const positions = props.positions ?? []
		return render(Subject, {
			positions: [],
			moveToJointPositions: vi.fn(),
			lastError: null,
			jointLimitsDegrees: jointLimitsForCount(positions.length),
			...props,
		})
	}

	it('renders a slider for each joint', () => {
		renderSubject({
			positions: [1, 2, 3],
			jointLimitsDegrees: jointLimitsForCount(3),
		})

		expect(screen.getAllByRole('slider')).toHaveLength(3)
	})

	it('labels each slider with its joint index', () => {
		renderSubject({
			positions: [0, 0],
			jointLimitsDegrees: jointLimitsForCount(2),
		})

		expect(screen.getByRole('slider', { name: 'Joint 0 position' })).toBeInTheDocument()
		expect(screen.getByRole('slider', { name: 'Joint 1 position' })).toBeInTheDocument()
	})

	it('sets slider min and max from jointLimitsDegrees', () => {
		renderSubject({
			positions: [0],
			jointLimitsDegrees: [{ minDegrees: -90, maxDegrees: 90 }],
		})

		const slider = screen.getByRole('slider')
		expect(slider).toHaveAttribute('min', '-90')
		expect(slider).toHaveAttribute('max', '90')
	})

	it('uses -180/180 as default bounds when no joint limits are provided', () => {
		renderSubject({
			positions: [0],
			jointLimitsDegrees: [],
		})

		const slider = screen.getByRole('slider')
		expect(slider).toHaveAttribute('min', '-180')
		expect(slider).toHaveAttribute('max', '180')
	})

	it('auto-executes immediately when a slider is adjusted by less than 5 degrees', () => {
		const moveToJointPositions = vi.fn()
		renderSubject({
			positions: [0],
			moveToJointPositions,
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		const slider = screen.getByRole('slider')
		fireEvent.input(slider, { target: { value: '3' } })
		fireEvent.change(slider, { target: { value: '3' } })

		expect(moveToJointPositions).toHaveBeenCalledWith([3])
	})

	it('does not auto-execute when a slider is adjusted by 5 degrees or more', () => {
		const moveToJointPositions = vi.fn()
		renderSubject({
			positions: [0],
			moveToJointPositions,
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		const slider = screen.getByRole('slider')
		fireEvent.input(slider, { target: { value: '50' } })
		fireEvent.change(slider, { target: { value: '50' } })

		expect(moveToJointPositions).not.toHaveBeenCalled()
	})

	it('shows a warning with the delta when a large move is staged', () => {
		renderSubject({
			positions: [0],
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		const slider = screen.getByRole('slider')
		fireEvent.input(slider, { target: { value: '30' } })
		fireEvent.change(slider, { target: { value: '30' } })

		expect(screen.getByText(/large move/iu)).toBeInTheDocument()
		expect(screen.getByText(/\+30\.00°/u)).toBeInTheDocument()
	})

	it('shows a prompt to use Execute when large moves are pending', () => {
		renderSubject({
			positions: [0],
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		const slider = screen.getByRole('slider')
		fireEvent.input(slider, { target: { value: '20' } })
		fireEvent.change(slider, { target: { value: '20' } })

		expect(screen.getByText(/review warnings/iu)).toBeInTheDocument()
	})

	it('dismissing a warning hides it', async () => {
		renderSubject({
			positions: [0],
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		const slider = screen.getByRole('slider')
		fireEvent.input(slider, { target: { value: '30' } })
		fireEvent.change(slider, { target: { value: '30' } })

		expect(screen.getByText(/large move/iu)).toBeInTheDocument()

		const dismissButton = screen.getByRole('button', { name: /dismiss warning for joint 0/iu })
		await user.click(dismissButton)

		expect(screen.queryByText(/large move/iu)).not.toBeInTheDocument()
	})

	it('Execute button calls moveToJointPositions with current desired positions', async () => {
		const moveToJointPositions = vi.fn()
		renderSubject({
			positions: [0],
			moveToJointPositions,
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		const slider = screen.getByRole('slider')
		fireEvent.input(slider, { target: { value: '45' } })
		fireEvent.change(slider, { target: { value: '45' } })

		expect(moveToJointPositions).not.toHaveBeenCalled()

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(moveToJointPositions).toHaveBeenCalledWith([45])
	})

	it('resets all sliders to zero when Zero button is clicked', async () => {
		renderSubject({
			positions: [10, 20],
			jointLimitsDegrees: jointLimitsForCount(2),
		})

		const zeroButton = screen.getByRole('button', { name: /zero/iu })
		await user.click(zeroButton)

		for (const slider of screen.getAllByRole('slider')) {
			expect(slider).toHaveValue('0')
		}
	})

	it('resets sliders to current position when Current position button is clicked', async () => {
		renderSubject({
			positions: [10, 20],
			jointLimitsDegrees: jointLimitsForCount(2),
		})

		// Stage a change so sliders diverge from current
		const [slider] = screen.getAllByRole('slider')
		fireEvent.input(slider!, { target: { value: '45' } })
		fireEvent.change(slider!, { target: { value: '45' } })

		const currentPositionButton = screen.getByRole('button', { name: /current position/iu })
		await user.click(currentPositionButton)

		const sliders = screen.getAllByRole('slider')
		expect(sliders[0]).toHaveValue('10')
		expect(sliders[1]).toHaveValue('20')
	})

	it('displays the provided error', () => {
		renderSubject({ lastError: new Error('some error msg') })
		expect(screen.getByText(/some error msg/iu)).toBeInTheDocument()
	})

	describe('±5° increment buttons', () => {
		it('renders decrease and increase buttons for each joint', () => {
			renderSubject({
				positions: [0, 0],
				jointLimitsDegrees: jointLimitsForCount(2),
			})

			expect(screen.getAllByRole('button', { name: /decrease joint \d by 5 degrees/iu })).toHaveLength(2)
			expect(screen.getAllByRole('button', { name: /increase joint \d by 5 degrees/iu })).toHaveLength(2)
		})

		it('+5° button increases the slider value by 5', async () => {
			renderSubject({
				positions: [0],
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			await user.click(screen.getByRole('button', { name: /increase joint 0 by 5 degrees/iu }))

			expect(screen.getByRole('slider')).toHaveValue('5')
		})

		it('-5° button decreases the slider value by 5', async () => {
			renderSubject({
				positions: [0],
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			await user.click(screen.getByRole('button', { name: /decrease joint 0 by 5 degrees/iu }))

			expect(screen.getByRole('slider')).toHaveValue('-5')
		})

		it('+5° button clamps to joint max', async () => {
			renderSubject({
				positions: [0],
				jointLimitsDegrees: [{ minDegrees: -90, maxDegrees: 90 }],
			})

			// Set slider near max first
			const slider = screen.getByRole('slider')
			fireEvent.input(slider, { target: { value: '88' } })
			fireEvent.change(slider, { target: { value: '88' } })

			await user.click(screen.getByRole('button', { name: /increase joint 0 by 5 degrees/iu }))

			expect(slider).toHaveValue('90')
		})

		it('-5° button clamps to joint min', async () => {
			renderSubject({
				positions: [0],
				jointLimitsDegrees: [{ minDegrees: -90, maxDegrees: 90 }],
			})

			const slider = screen.getByRole('slider')
			fireEvent.input(slider, { target: { value: '-88' } })
			fireEvent.change(slider, { target: { value: '-88' } })

			await user.click(screen.getByRole('button', { name: /decrease joint 0 by 5 degrees/iu }))

			expect(slider).toHaveValue('-90')
		})

		it('+5° button shows large move warning when total delta >= 5 degrees', async () => {
			renderSubject({
				positions: [0],
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			await user.click(screen.getByRole('button', { name: /increase joint 0 by 5 degrees/iu }))

			expect(screen.getByText(/large move/iu)).toBeInTheDocument()
		})

		it('increment button auto-executes when resulting delta from current position is under threshold', async () => {
			const moveToJointPositions = vi.fn()
			// Arm at 0°; stage desired to -3° via slider (delta 3°, auto-executed), then +5° → desired 2°, delta 2° → auto-execute
			renderSubject({
				positions: [0],
				moveToJointPositions,
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			const slider = screen.getByRole('slider')
			fireEvent.input(slider, { target: { value: '-3' } })
			fireEvent.change(slider, { target: { value: '-3' } })

			moveToJointPositions.mockClear()

			await user.click(screen.getByRole('button', { name: /increase joint 0 by 5 degrees/iu }))

			// desired is now 2°, delta from current (0°) is 2° < 5° → auto-execute
			expect(moveToJointPositions).toHaveBeenCalledWith([2])
			expect(screen.queryByText(/large move/iu)).not.toBeInTheDocument()
		})
	})
})
