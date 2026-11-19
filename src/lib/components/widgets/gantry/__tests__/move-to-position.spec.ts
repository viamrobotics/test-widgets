import type { ComponentProps } from 'svelte'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../move-to-position.svelte'

describe('Gantry move-to-position', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			positions: [],
			moveTo: vi.fn(),
			...props,
		})

	it('renders a group for each axis with inputs for position and speed', () => {
		renderSubject({
			positions: [1, 2, 3],
		})

		const positionInputs = screen.getAllByRole('spinbutton', {
			name: /^position/iu,
		})
		const speedInputs = screen.getAllByRole('spinbutton', { name: /speed/iu })

		expect(positionInputs).toHaveLength(3)
		expect(speedInputs).toHaveLength(3)
		expect(screen.getByRole('group', { name: 'Axis 0' })).toBeInTheDocument()
		expect(screen.getByRole('group', { name: 'Axis 2' })).toBeInTheDocument()
	})

	it('follows the live position until a field is edited', async () => {
		const { rerender } = renderSubject({ positions: [1, 2] })
		const [first, second] = screen.getAllByRole('spinbutton', { name: /^position/iu })

		await user.clear(first!)
		await user.click(first!)
		await user.keyboard('5{Enter}')
		await rerender({ positions: [10, 20] })

		expect(first).toHaveValue(5)
		expect(second).toHaveValue(20)
	})

	it('restores one axis to its current value from its restore button', async () => {
		renderSubject({ positions: [1.5, 2] })
		const axis0 = within(screen.getByRole('group', { name: 'Axis 0' }))
		const restore = axis0.getByRole('button', {
			name: 'Reset Axis 0 position to its current value, 1.50 mm',
		})
		expect(restore).toBeDisabled()

		const input = axis0.getByRole('spinbutton', { name: /^position/iu })
		await user.clear(input)
		await user.click(input)
		await user.keyboard('9{Enter}')
		expect(restore).toBeEnabled()
		await user.click(restore)

		expect(input).toHaveValue(1.5)
		expect(restore).toBeDisabled()
	})

	it('warns when the gantry drifts away from an edited position', async () => {
		const { rerender } = renderSubject({ positions: [1, 2] })
		const input = screen.getAllByRole('spinbutton', { name: /^position/iu })[0]!

		await user.clear(input)
		await user.click(input)
		await user.keyboard('9{Enter}')
		expect(screen.queryByText(/Gantry moved/u)).not.toBeInTheDocument()
		await rerender({ positions: [6, 2] })

		expect(screen.getByText('Gantry moved 5.00 mm since you edited axis 0.')).toBeInTheDocument()
	})

	it('updates desired positions and speeds on input change', async () => {
		renderSubject({
			positions: [1, 2],
		})

		const positionInput = screen.getAllByRole('spinbutton', {
			name: /^position/iu,
		})[0]!
		const speedInput = screen.getAllByRole('spinbutton', {
			name: /speed/iu,
		})[0]!

		await user.clear(positionInput)
		await user.click(positionInput)
		await user.keyboard('5{Enter}')
		await user.clear(speedInput)
		await user.click(speedInput)
		await user.keyboard('100{Enter}')

		expect(positionInput).toHaveValue(5)
		expect(speedInput).toHaveValue(100)
	})

	it('resets to zero when Zero button is clicked', async () => {
		renderSubject({
			positions: [1, 2],
		})

		const positionInputs = screen.getAllByRole('spinbutton', {
			name: /^position/iu,
		})
		const speedInputs = screen.getAllByRole('spinbutton', { name: /speed/iu })
		// set one speed input to a non-default value
		const nonDefaultSpeed = speedInputs[0]!

		await user.clear(nonDefaultSpeed)
		await user.click(nonDefaultSpeed)
		await user.keyboard('100{Enter}')
		expect(nonDefaultSpeed).toHaveValue(100)

		// press zero
		const zeroButton = screen.getByRole('button', { name: /zero/iu })
		await user.click(zeroButton)

		for (const input of positionInputs) {
			expect(input).toHaveValue(0)
		}
		for (const input of speedInputs) {
			expect(input).toHaveValue(50)
		}
	})

	it('resets to current positions when Current position button is clicked', async () => {
		const positions = [1, 2]
		renderSubject({
			positions,
		})

		const positionInputs = screen.getAllByRole('spinbutton', {
			name: /^position/iu,
		})

		// set one position input to a non-default value
		const nonDefaultPos = positionInputs[0]!

		await user.clear(nonDefaultPos)
		await user.click(nonDefaultPos)
		await user.keyboard('42{Enter}')
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

	it('calls moveTo with the correct parameters when Execute button is clicked', async () => {
		const moveTo = vi.fn()
		renderSubject({
			positions: [1],
			moveTo,
		})

		const positionInput = screen.getByRole('spinbutton', { name: /^position/iu })
		const speedInput = screen.getByRole('spinbutton', { name: /speed/iu })

		await user.clear(positionInput)
		await user.click(positionInput)
		await user.keyboard('5{Enter}')
		await user.clear(speedInput)
		await user.click(speedInput)
		await user.keyboard('100{Enter}')

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(moveTo).toHaveBeenCalledWith([5], [100])
	})
})
