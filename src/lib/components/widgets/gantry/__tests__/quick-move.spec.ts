import type { ComponentProps } from 'svelte'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../quick-move.svelte'

describe('GantryView quick-move', () => {
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

	it('renders a row for each position', () => {
		renderSubject({
			positions: [1, 2, 3],
		})

		const rows = screen.getAllByRole('row')
		// 3 for positions, 1 for header
		expect(rows).toHaveLength(3 + 1)
	})

	it('calls quickMove with the correct parameters when minus button is clicked on row 0', async () => {
		const moveTo = vi.fn()
		renderSubject({
			positions: [1, 2],
			moveTo,
		})

		const rows = screen.getAllByRole('row')
		expect(rows).toHaveLength(3)

		const axis0 = rows[1]!

		const minusButton = within(axis0).getByRole('button', {
			name: 'minus-ten-degrees',
		})
		expect(minusButton).toBeInTheDocument()
		await user.click(minusButton)

		expect(moveTo).toHaveBeenCalledWith([-9, 2], [50, 50])
	})

	it('calls quickMove with the correct parameters when minus button is clicked on row 1', async () => {
		const moveTo = vi.fn()
		renderSubject({
			positions: [1, 2, 3],
			moveTo,
		})

		const rows = screen.getAllByRole('row')
		expect(rows).toHaveLength(4)

		const axis1 = rows[2]!

		const minusButton = within(axis1).getByRole('button', {
			name: 'minus-ten-degrees',
		})
		expect(minusButton).toBeInTheDocument()
		await user.click(minusButton)

		expect(moveTo).toHaveBeenCalledWith([1, -8, 3], [50, 50, 50])
	})

	it('calls quickMove with the correct parameters when plus button is clicked', async () => {
		const moveTo = vi.fn()
		renderSubject({
			positions: [1],
			moveTo,
		})

		const plusButton = screen.getByRole('button', {
			name: 'plus-ten-degrees',
		})
		expect(plusButton).toBeInTheDocument()
		await user.click(plusButton)

		expect(moveTo).toHaveBeenCalledWith([11], [50])
	})

	it('displays the provided error', () => {
		renderSubject({ lastError: new Error('some error msg') })
		expect(screen.getByText(/some error msg/iu)).toBeInTheDocument()
	})
})
