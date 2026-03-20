import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../move-to-position.svelte'

describe('GantryView move-to-position', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			positions: [],
			moveTo: vi.fn(),
			lastError: null,
			...props,
		})

	it('renders a row for each axis with inputs for position and speed', () => {
		renderSubject({
			positions: [1, 2, 3],
		})

		const positionInputs = screen.getAllByRole('spinbutton', {
			name: /move to/iu,
		})
		const speedInputs = screen.getAllByRole('spinbutton', { name: /speed/iu })

		expect(positionInputs).toHaveLength(3)
		expect(speedInputs).toHaveLength(3)
	})

	it('updates desired positions and speeds on input change', async () => {
		renderSubject({
			positions: [1, 2],
		})

		const positionInput = screen.getAllByRole('spinbutton', {
			name: /move to/iu,
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
			name: /move to/iu,
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
			name: /move to/iu,
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

		const positionInput = screen.getByRole('spinbutton', { name: /move to/iu })
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

	it('displays the provided error', () => {
		renderSubject({ lastError: new Error('some error msg') })
		expect(screen.getByText(/some error msg/iu)).toBeInTheDocument()
	})
})
