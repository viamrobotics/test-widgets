import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../move-to-joint-positions.svelte'

describe('Arm move-to-joint-positions', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			positions: [],
			moveToJointPositions: vi.fn(),
			lastError: null,
			...props,
		})

	it('renders a row for each axis', () => {
		renderSubject({
			positions: [1, 2, 3],
		})

		const positionInputs = screen.getAllByRole('spinbutton')

		expect(positionInputs).toHaveLength(3)
	})

	it('trims axis values to 2 decimal places', () => {
		renderSubject({
			positions: [1, 2.34, 3.456_789],
		})

		const positionInputs = screen.getAllByRole('spinbutton')

		expect(positionInputs[0]).toHaveValue(1)
		expect(positionInputs[1]).toHaveValue(2.34)
		expect(positionInputs[2]).toHaveValue(3.46)
	})

	it('resets to zero when Zero button is clicked', async () => {
		renderSubject({
			positions: [1, 2],
		})

		const positionInputs = screen.getAllByRole('spinbutton')
		// set one speed pos to a non-default value
		const nonDefaultPos = positionInputs[0]!

		await user.clear(nonDefaultPos)
		await user.type(nonDefaultPos, '100')
		expect(nonDefaultPos).toHaveValue(100)

		// press zero
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
		})

		const positionInputs = screen.getAllByRole('spinbutton')

		// set one position input to a non-default value
		const nonDefaultPos = positionInputs[0]!

		await user.clear(nonDefaultPos)
		await user.type(nonDefaultPos, '42')

		expect(nonDefaultPos).toHaveValue(42)

		// press current
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
})
