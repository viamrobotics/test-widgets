import type { ComponentProps } from 'svelte'

import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

	it('renders a slider with text input for each joint', () => {
		renderSubject({
			positions: [1, 2, 3],
			jointLimitsDegrees: jointLimitsForCount(3),
		})

		expect(screen.getAllByRole('textbox')).toHaveLength(3)
	})

	it('labels each slider with its joint index', () => {
		renderSubject({
			positions: [0, 0],
			jointLimitsDegrees: jointLimitsForCount(2),
		})

		expect(screen.getByRole('rowheader', { name: '0' })).toBeInTheDocument()
		expect(screen.getByRole('rowheader', { name: '1' })).toBeInTheDocument()
	})

	it('does not execute when a slider value is changed', () => {
		const moveToJointPositions = vi.fn()
		renderSubject({
			positions: [0],
			moveToJointPositions,
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		const textInput = screen.getByRole('textbox')
		fireEvent.change(textInput, { target: { value: '3' } })

		expect(moveToJointPositions).not.toHaveBeenCalled()
	})

	it('does not execute when a large slider change is staged', () => {
		const moveToJointPositions = vi.fn()
		renderSubject({
			positions: [0],
			moveToJointPositions,
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		const textInput = screen.getByRole('textbox')
		fireEvent.change(textInput, { target: { value: '50' } })

		expect(moveToJointPositions).not.toHaveBeenCalled()
		expect(screen.queryByText(/large move/iu)).not.toBeInTheDocument()
	})

	it('Execute button calls moveToJointPositions with current desired positions', async () => {
		const moveToJointPositions = vi.fn()
		renderSubject({
			positions: [0],
			moveToJointPositions,
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		const textInput = screen.getByRole('textbox')
		fireEvent.change(textInput, { target: { value: '45' } })

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

		for (const textInput of screen.getAllByRole('textbox')) {
			expect(Number((textInput as HTMLInputElement).value)).toBeCloseTo(0)
		}
	})

	it('Zero button does not auto-execute', async () => {
		const moveToJointPositions = vi.fn()
		renderSubject({
			positions: [30],
			moveToJointPositions,
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		await user.click(screen.getByRole('button', { name: /zero/iu }))

		expect(moveToJointPositions).not.toHaveBeenCalled()
	})

	it('resets sliders to current position when Current position button is clicked', async () => {
		renderSubject({
			positions: [10, 20],
			jointLimitsDegrees: jointLimitsForCount(2),
		})

		const [textInput] = screen.getAllByRole('textbox')
		fireEvent.change(textInput!, { target: { value: '45' } })

		const currentPositionButton = screen.getByRole('button', { name: /current position/iu })
		await user.click(currentPositionButton)

		const textInputs = screen.getAllByRole('textbox')
		expect(textInputs[0]).toHaveValue('10.0')
		expect(textInputs[1]).toHaveValue('20.0')
	})

	describe('paste', () => {
		beforeEach(() => {
			vi.spyOn(globalThis.navigator.clipboard, 'readText')
		})

		afterEach(() => {
			vi.restoreAllMocks()
		})

		it('does not auto-execute when values are pasted', async () => {
			vi.mocked(navigator.clipboard.readText).mockResolvedValue('[30]')
			const moveToJointPositions = vi.fn()
			renderSubject({
				positions: [0],
				moveToJointPositions,
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			await user.click(screen.getByRole('button', { name: /paste from clipboard/iu }))

			expect(moveToJointPositions).not.toHaveBeenCalled()
		})

		it('clamps pasted values to jointLimitsDegrees', async () => {
			vi.mocked(navigator.clipboard.readText).mockResolvedValue('[200]')
			renderSubject({
				positions: [0],
				jointLimitsDegrees: [{ minDegrees: -90, maxDegrees: 90 }],
			})

			await user.click(screen.getByRole('button', { name: /paste from clipboard/iu }))

			expect(screen.getByRole('textbox')).toHaveValue('90.0')
		})
	})

	it('displays the provided error', () => {
		renderSubject({ lastError: new Error('some error msg') })
		expect(screen.getByText(/some error msg/iu)).toBeInTheDocument()
	})

	const switchToQuickMove = async () => {
		await user.click(screen.getByRole('button', { name: /quick move/iu }))
	}

	describe('control mode toggle', () => {
		it('marks the selected mode as pressed', async () => {
			renderSubject({
				positions: [0],
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			const jointPositions = screen.getByRole('button', { name: /joint positions/iu })
			const quickMove = screen.getByRole('button', { name: /quick move/iu })

			expect(jointPositions).toHaveAttribute('aria-pressed', 'true')
			expect(quickMove).toHaveAttribute('aria-pressed', 'false')

			await switchToQuickMove()

			expect(jointPositions).toHaveAttribute('aria-pressed', 'false')
			expect(quickMove).toHaveAttribute('aria-pressed', 'true')
		})

		it('returns to the slider editor when Joint Positions is selected', async () => {
			renderSubject({
				positions: [0],
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			await switchToQuickMove()
			expect(screen.queryByRole('textbox')).not.toBeInTheDocument()

			await user.click(screen.getByRole('button', { name: /joint positions/iu }))

			expect(screen.getByRole('textbox')).toBeInTheDocument()
			expect(
				screen.queryByRole('button', { name: /increase joint 0 by 5 degrees/iu })
			).not.toBeInTheDocument()
		})
	})

	describe('quick move mode', () => {
		it('renders ±5° buttons only after switching to quick move', async () => {
			renderSubject({
				positions: [0, 0],
				jointLimitsDegrees: jointLimitsForCount(2),
			})

			expect(
				screen.queryByRole('button', { name: /decrease joint \d by 5 degrees/iu })
			).not.toBeInTheDocument()

			await switchToQuickMove()

			expect(
				screen.getAllByRole('button', { name: /decrease joint \d by 5 degrees/iu })
			).toHaveLength(2)
			expect(
				screen.getAllByRole('button', { name: /increase joint \d by 5 degrees/iu })
			).toHaveLength(2)
		})

		it('+5° button executes immediately with current position plus 5', async () => {
			const moveToJointPositions = vi.fn()
			renderSubject({
				positions: [10],
				moveToJointPositions,
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			await switchToQuickMove()
			await user.click(screen.getByRole('button', { name: /increase joint 0 by 5 degrees/iu }))

			expect(moveToJointPositions).toHaveBeenCalledWith([15])
		})

		it('-5° button executes immediately with current position minus 5', async () => {
			const moveToJointPositions = vi.fn()
			renderSubject({
				positions: [10],
				moveToJointPositions,
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			await switchToQuickMove()
			await user.click(screen.getByRole('button', { name: /decrease joint 0 by 5 degrees/iu }))

			expect(moveToJointPositions).toHaveBeenCalledWith([5])
		})

		it('disables ±5° buttons while the arm is moving', async () => {
			renderSubject({
				positions: [0],
				isMoving: true,
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			await switchToQuickMove()

			expect(screen.getByRole('button', { name: /decrease joint 0 by 5 degrees/iu })).toBeDisabled()
			expect(screen.getByRole('button', { name: /increase joint 0 by 5 degrees/iu })).toBeDisabled()
		})

		it('does not execute quick move when the arm is moving', async () => {
			const moveToJointPositions = vi.fn()
			renderSubject({
				positions: [0],
				moveToJointPositions,
				isMoving: true,
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			await switchToQuickMove()
			await user.click(screen.getByRole('button', { name: /increase joint 0 by 5 degrees/iu }))

			expect(moveToJointPositions).not.toHaveBeenCalled()
		})

		it('shows a warning that quick move executes immediately', async () => {
			renderSubject({
				positions: [0],
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			await switchToQuickMove()

			expect(screen.getByText(/quick move executes immediately/iu)).toBeInTheDocument()
		})
	})
})
