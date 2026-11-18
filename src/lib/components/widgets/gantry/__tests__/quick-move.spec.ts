import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../quick-move.svelte'

describe('Gantry quick-move', () => {
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

	it('renders a group for each axis', () => {
		renderSubject({
			positions: [1, 2, 3],
		})

		expect(screen.getByRole('group', { name: 'Axis 0' })).toBeInTheDocument()
		expect(screen.getByRole('group', { name: 'Axis 2' })).toBeInTheDocument()
		expect(screen.queryByRole('row')).not.toBeInTheDocument()
		expect(screen.getAllByRole('button')).toHaveLength(6)
	})

	it('calls quickMove with the correct parameters when minus button is clicked on axis 0', async () => {
		const moveTo = vi.fn()
		renderSubject({
			positions: [1, 2],
			moveTo,
		})

		const minusButton = screen.getByRole('button', {
			name: 'Axis 0, −10 mm',
		})
		expect(minusButton).toBeInTheDocument()
		await user.click(minusButton)

		expect(moveTo).toHaveBeenCalledWith([-9, 2], [50, 50])
	})

	it('calls quickMove with the correct parameters when minus button is clicked on axis 1', async () => {
		const moveTo = vi.fn()
		renderSubject({
			positions: [1, 2, 3],
			moveTo,
		})

		const minusButton = screen.getByRole('button', {
			name: 'Axis 1, −10 mm',
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
			name: 'Axis 0, +10 mm',
		})
		expect(plusButton).toBeInTheDocument()
		await user.click(plusButton)

		expect(moveTo).toHaveBeenCalledWith([11], [50])
	})
})
