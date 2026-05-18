import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
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

	it('renders a row for each axis', () => {
		renderSubject({
			positions: [1, 2, 3],
			jointLimitsDegrees: jointLimitsForCount(3),
		})

		expect(screen.getAllByRole('spinbutton')).toHaveLength(3)
	})

	it('trims axis values to 2 decimal places', () => {
		renderSubject({
			positions: [1, 2.34, 3.456_789],
			jointLimitsDegrees: jointLimitsForCount(3),
		})

		const positionInputs = screen.getAllByRole('spinbutton')

		expect(positionInputs[0]).toHaveValue(1)
		expect(positionInputs[1]).toHaveValue(2.34)
		expect(positionInputs[2]).toHaveValue(3.46)
	})

	it('resets to zero when Zero button is clicked', async () => {
		renderSubject({
			positions: [1, 2],
			jointLimitsDegrees: jointLimitsForCount(2),
		})

		const positionInputs = screen.getAllByRole('spinbutton')
		const nonDefaultPos = positionInputs[0]!

		await user.clear(nonDefaultPos)
		await user.type(nonDefaultPos, '100')
		expect(nonDefaultPos).toHaveValue(100)

		const zeroButton = screen.getByRole('button', { name: /zero/iu })
		await user.click(zeroButton)

		for (const input of positionInputs) {
			expect(input).toHaveValue(0)
		}
	})

	it('resets desired positions when Current position button is clicked', async () => {
		const positions = [1, 2]
		renderSubject({
			positions,
			jointLimitsDegrees: jointLimitsForCount(2),
		})

		const positionInputs = screen.getAllByRole('spinbutton')
		const nonDefaultPos = positionInputs[0]!

		await user.clear(nonDefaultPos)
		await user.type(nonDefaultPos, '42')

		expect(nonDefaultPos).toHaveValue(42)

		const currentPositionButton = screen.getByRole('button', {
			name: /current position/iu,
		})
		await user.click(currentPositionButton)

		for (const [index, input] of positionInputs.entries()) {
			expect(input).toHaveValue(positions[index])
		}
	})

	it('calls moveToJointPositions with the correct parameters when Execute button is clicked', async () => {
		const moveToJointPositions = vi.fn()
		renderSubject({
			positions: [1],
			moveToJointPositions,
			jointLimitsDegrees: jointLimitsForCount(1),
		})

		const positionInput = screen.getByRole('spinbutton')

		await user.clear(positionInput)
		await user.type(positionInput, '5')

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(moveToJointPositions).toHaveBeenCalledWith([5])
	})

	it('displays the provided error', () => {
		renderSubject({ lastError: new Error('some error msg') })
		expect(screen.getByText(/some error msg/iu)).toBeInTheDocument()
	})

	it('displays joint limit bounds beside inputs when provided', () => {
		renderSubject({
			positions: [0, 0],
			jointLimitsDegrees: [
				{ minDegrees: -90, maxDegrees: 90 },
				{ minDegrees: 0, maxDegrees: 180 },
			],
		})

		expect(screen.getByTitle('Minimum')).toHaveTextContent('-90.00')
		expect(screen.getByTitle('Maximum')).toHaveTextContent('90.00')
		expect(screen.getAllByTitle('Minimum')[1]).toHaveTextContent('0.00')
		expect(screen.getAllByTitle('Maximum')[1]).toHaveTextContent('180.00')
	})

	it('omits joint limit bounds for joints without limit data', () => {
		renderSubject({
			positions: [0, 0],
			jointLimitsDegrees: [{ minDegrees: -45, maxDegrees: 45 }],
		})

		expect(screen.getAllByTitle('Minimum')).toHaveLength(1)
		expect(screen.getAllByTitle('Maximum')).toHaveLength(1)
	})
})
