import type { ComponentProps } from 'svelte'

import { fireEvent, render, screen, within } from '@testing-library/svelte'
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
			jointLimitsDegrees: jointLimitsForCount(positions.length),
			...props,
		})
	}

	const switchToJointPositions = async () => {
		await user.click(screen.getByRole('radio', { name: /joint positions/iu }))
	}

	const renderJointPositionsEditor = async (props: Partial<ComponentProps<typeof Subject>>) => {
		const result = renderSubject(props)
		await switchToJointPositions()
		return result
	}

	const jointReadout = (jointIndex: number) =>
		screen.getByRole('spinbutton', { name: `Joint ${jointIndex}` })

	const typeJointValue = (jointIndex: number, value: string) => {
		fireEvent.input(jointReadout(jointIndex), { target: { value } })
	}

	it('renders a range and a numeric readout for each joint', async () => {
		await renderJointPositionsEditor({
			positions: [1, 2, 3],
			jointLimitsDegrees: jointLimitsForCount(3),
		})

		expect(screen.getAllByRole('slider')).toHaveLength(3)
		expect(screen.getAllByRole('spinbutton')).toHaveLength(3)
	})

	it('labels each slider with its joint index', async () => {
		await renderJointPositionsEditor({
			positions: [0, 0],
			jointLimitsDegrees: jointLimitsForCount(2),
		})

		expect(screen.getByRole('slider', { name: 'Joint 0' })).toBeInTheDocument()
		expect(screen.getByRole('slider', { name: 'Joint 1' })).toBeInTheDocument()
	})

	it('suffixes each readout with the angle unit', async () => {
		await renderJointPositionsEditor({
			positions: [0],
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		expect(jointReadout(0)).toHaveAccessibleDescription('°')
	})

	it('does not execute when a readout value is typed', async () => {
		const moveToJointPositions = vi.fn()
		await renderJointPositionsEditor({
			positions: [0],
			moveToJointPositions,
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		typeJointValue(0, '3')

		expect(moveToJointPositions).not.toHaveBeenCalled()
	})

	it('does not execute while the range is dragged', async () => {
		const moveToJointPositions = vi.fn()
		await renderJointPositionsEditor({
			positions: [0],
			moveToJointPositions,
			jointLimitsDegrees: jointLimitsForCount(1),
		})
		const range = screen.getByRole('slider', { name: 'Joint 0' })

		for (const value of ['10', '20', '30', '40', '50']) {
			fireEvent.input(range, { target: { value } })
		}

		expect(moveToJointPositions).not.toHaveBeenCalled()
		expect(jointReadout(0)).toHaveValue(50)
	})

	it('does not execute when a large change is staged', async () => {
		const moveToJointPositions = vi.fn()
		await renderJointPositionsEditor({
			positions: [0],
			moveToJointPositions,
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		typeJointValue(0, '50')

		expect(moveToJointPositions).not.toHaveBeenCalled()
		expect(screen.queryByText(/large move/iu)).not.toBeInTheDocument()
	})

	it('Execute button calls moveToJointPositions with current desired positions', async () => {
		const moveToJointPositions = vi.fn()
		await renderJointPositionsEditor({
			positions: [0],
			moveToJointPositions,
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		typeJointValue(0, '45')

		expect(moveToJointPositions).not.toHaveBeenCalled()

		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(moveToJointPositions).toHaveBeenCalledWith([45])
	})

	describe('a typed value past the joint limit', () => {
		const renderWithNarrowLimit = async (moveToJointPositions = vi.fn()) => {
			await renderJointPositionsEditor({
				positions: [0],
				moveToJointPositions,
				jointLimitsDegrees: [{ minDegrees: -90, maxDegrees: 90 }],
			})
			typeJointValue(0, '120')
			return moveToJointPositions
		}

		it('is flagged on the readout before the move runs', async () => {
			const moveToJointPositions = await renderWithNarrowLimit()

			expect(moveToJointPositions).not.toHaveBeenCalled()
			expect(jointReadout(0)).toHaveAttribute('aria-invalid', 'true')
			expect(
				screen.getByText('Joint 0 is outside its limits, -90.00° to 90.00°.', {
					selector: '.sr-only',
				})
			).toBeInTheDocument()
		})

		it('is not clamped', async () => {
			const moveToJointPositions = await renderWithNarrowLimit()

			await user.click(screen.getByRole('button', { name: /execute/iu }))

			expect(jointReadout(0)).toHaveValue(120)
			expect(moveToJointPositions).toHaveBeenCalledWith([120])
		})
	})

	it('resets all sliders to zero when Zero button is clicked', async () => {
		await renderJointPositionsEditor({
			positions: [10, 20],
			jointLimitsDegrees: jointLimitsForCount(2),
		})

		await user.click(screen.getByRole('button', { name: /zero/iu }))

		expect(jointReadout(0)).toHaveValue(0)
		expect(jointReadout(1)).toHaveValue(0)
	})

	it('Zero button does not auto-execute', async () => {
		const moveToJointPositions = vi.fn()
		await renderJointPositionsEditor({
			positions: [30],
			moveToJointPositions,
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		await user.click(screen.getByRole('button', { name: /zero/iu }))

		expect(moveToJointPositions).not.toHaveBeenCalled()
	})

	it('resets sliders to current position when Current position button is clicked', async () => {
		await renderJointPositionsEditor({
			positions: [10, 20],
			jointLimitsDegrees: jointLimitsForCount(2),
		})

		typeJointValue(0, '45')
		await user.click(screen.getByRole('button', { name: /current position/iu }))

		expect(jointReadout(0)).toHaveValue(10)
		expect(jointReadout(1)).toHaveValue(20)
	})

	it('follows the live position in joints the user has not edited', async () => {
		const { rerender } = await renderJointPositionsEditor({
			positions: [10],
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		await rerender({ positions: [20] })

		expect(jointReadout(0)).toHaveValue(20)
		expect(
			document.querySelector('button[aria-label="Reset joint 0 to 20.00°"]')
		).toBeInTheDocument()
	})

	it('rounds a live reading to the step on the readout', async () => {
		await renderJointPositionsEditor({
			positions: [12.3456],
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		expect(jointReadout(0)).toHaveValue(12.3)
	})

	it('hides the restore button of a joint the user has not edited', async () => {
		await renderJointPositionsEditor({
			positions: [10],
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		expect(screen.queryByRole('button', { name: /^Reset joint 0 to / })).not.toBeInTheDocument()
	})

	it('keeps an edited joint and flags it once the arm drifts past the threshold', async () => {
		const { rerender } = await renderJointPositionsEditor({
			positions: [10],
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		typeJointValue(0, '45')
		await rerender({ positions: [12] })

		expect(jointReadout(0)).toHaveValue(45)
		expect(jointReadout(0)).toHaveAttribute('data-field-state', 'warn')
		expect(
			screen.getByText(/arm moved 2(\.0+)?° since you edited joint 0/iu, { selector: '.sr-only' })
		).toBeInTheDocument()
	})

	it('resets one edited joint to the live position', async () => {
		await renderJointPositionsEditor({
			positions: [10],
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		typeJointValue(0, '45')
		await user.click(screen.getByRole('button', { name: 'Reset joint 0 to 10.00°' }))

		expect(jointReadout(0)).toHaveValue(10)
	})

	it('locks Execute and marks only edited joints while the arm moves', async () => {
		const { rerender } = await renderJointPositionsEditor({
			positions: [10, 20],
			jointLimitsDegrees: jointLimitsForCount(2),
		})

		typeJointValue(0, '45')
		await rerender({ isMoving: true })

		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
		expect(within(screen.getByRole('status')).getByText(/arm is moving/iu)).toBeInTheDocument()
		expect(screen.getAllByText(/the arm is moving/iu, { selector: '.sr-only' })).toHaveLength(1)
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
			await renderJointPositionsEditor({
				positions: [0],
				moveToJointPositions,
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			await user.click(screen.getByRole('button', { name: /paste from clipboard/iu }))

			expect(moveToJointPositions).not.toHaveBeenCalled()
		})

		it('clamps pasted values to jointLimitsDegrees', async () => {
			vi.mocked(navigator.clipboard.readText).mockResolvedValue('[200]')
			await renderJointPositionsEditor({
				positions: [0],
				jointLimitsDegrees: [{ minDegrees: -90, maxDegrees: 90 }],
			})

			await user.click(screen.getByRole('button', { name: /paste from clipboard/iu }))

			expect(jointReadout(0)).toHaveValue(90)
		})
	})

	describe('control mode toggle', () => {
		it('defaults to Jogging and marks the selected mode as checked', async () => {
			renderSubject({
				positions: [0],
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			const jogging = screen.getByRole('radio', { name: /jogging/iu })
			const jointPositions = screen.getByRole('radio', { name: /joint positions/iu })

			expect(jogging).toHaveAttribute('aria-checked', 'true')
			expect(jointPositions).toHaveAttribute('aria-checked', 'false')

			await switchToJointPositions()

			expect(jogging).toHaveAttribute('aria-checked', 'false')
			expect(jointPositions).toHaveAttribute('aria-checked', 'true')
		})

		it('lists Jogging before Joint Positions', () => {
			renderSubject({
				positions: [0],
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			const modeGroup = screen.getByRole('group', { name: /control mode/iu })
			const labels = within(modeGroup)
				.getAllByRole('radio')
				.map((button) => button.textContent?.trim())
			expect(labels).toEqual(['Jogging', 'Joint Positions'])
		})

		it('shows the slider editor only after Joint Positions is selected', async () => {
			renderSubject({
				positions: [0],
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			expect(screen.queryByRole('slider')).not.toBeInTheDocument()

			await switchToJointPositions()

			expect(screen.getByRole('slider')).toBeInTheDocument()
			expect(
				screen.queryByRole('button', { name: 'Joint 0, plus 5 degrees' })
			).not.toBeInTheDocument()

			await user.click(screen.getByRole('radio', { name: /jogging/iu }))

			expect(screen.queryByRole('slider')).not.toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Joint 0, plus 5 degrees' })).toBeInTheDocument()
		})
	})

	describe('jogging mode', () => {
		it('renders a jog button pair for each joint by default', () => {
			renderSubject({
				positions: [0, 0],
				jointLimitsDegrees: jointLimitsForCount(2),
			})

			expect(screen.getAllByRole('button', { name: /joint \d, minus 5 degrees/iu })).toHaveLength(2)
			expect(screen.getAllByRole('button', { name: /joint \d, plus 5 degrees/iu })).toHaveLength(2)
		})

		it('+5° sends the current position plus 5 once the queue settles', async () => {
			const moveToJointPositions = vi.fn()
			renderSubject({
				positions: [10],
				moveToJointPositions,
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			await user.click(screen.getByRole('button', { name: 'Joint 0, plus 5 degrees' }))

			expect(moveToJointPositions).not.toHaveBeenCalled()
			await vi.waitFor(() => {
				expect(moveToJointPositions).toHaveBeenCalledWith([15])
			})
		})

		it('−5° sends the current position minus 5 once the queue settles', async () => {
			const moveToJointPositions = vi.fn()
			renderSubject({
				positions: [10],
				moveToJointPositions,
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			await user.click(screen.getByRole('button', { name: 'Joint 0, minus 5 degrees' }))

			await vi.waitFor(() => {
				expect(moveToJointPositions).toHaveBeenCalledWith([5])
			})
		})

		it('disables the jog buttons while the arm is moving', () => {
			renderSubject({
				positions: [0],
				isMoving: true,
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			expect(screen.getByRole('button', { name: 'Joint 0, minus 5 degrees' })).toBeDisabled()
			expect(screen.getByRole('button', { name: 'Joint 0, plus 5 degrees' })).toBeDisabled()
		})

		it('hides the copy and paste controls', () => {
			renderSubject({
				positions: [0],
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			expect(
				screen.queryByRole('button', { name: /paste from clipboard/iu })
			).not.toBeInTheDocument()
		})

		it('warns that jogging executes immediately', () => {
			renderSubject({
				positions: [0],
				jointLimitsDegrees: jointLimitsForCount(1),
			})

			expect(screen.getByText(/jogging executes immediately on release/iu)).toBeInTheDocument()
		})
	})
})
