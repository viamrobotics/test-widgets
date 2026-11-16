import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../quick-move-widget.svelte'

const state = vi.hoisted((): { moveMutate: Mock; error: Error | null } => ({
	moveMutate: vi.fn(),
	error: null,
}))

vi.mock('@viamrobotics/sdk', () => ({
	GantryClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: [11, 22],
		isLoading: false,
		isSuccess: true,
		isError: false,
		error: null,
	})),
	createResourceMutation: vi.fn(() => ({
		mutate: state.moveMutate,
		isPending: false,
		get error() {
			return state.error
		},
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-gantry' },
	})

describe('Gantry QuickMove widget', () => {
	beforeEach(() => {
		state.moveMutate = vi.fn()
		state.error = null
	})

	it('renders a row for each axis from the current positions', () => {
		renderSubject()

		expect(screen.getAllByRole('button', { name: 'plus-ten-degrees' })).toHaveLength(2)
	})

	it('calls the moveToPosition mutation with the second axis moved up ten', async () => {
		renderSubject()

		await userEvent.click(screen.getAllByRole('button', { name: 'plus-ten-degrees' })[1]!)

		expect(state.moveMutate).toHaveBeenCalledWith(
			[
				[11, 32],
				[50, 50],
			],
			{}
		)
	})

	it('calls the moveToPosition mutation with the first axis moved down ten', async () => {
		renderSubject()

		await userEvent.click(screen.getAllByRole('button', { name: 'minus-ten-degrees' })[0]!)

		expect(state.moveMutate).toHaveBeenCalledWith(
			[
				[1, 22],
				[50, 50],
			],
			{}
		)
	})

	it('shows the mutation error line', () => {
		state.error = new Error('gantry refused to move')

		renderSubject()

		expect(screen.getByText(/gantry refused to move/iu)).toBeInTheDocument()
	})
})
