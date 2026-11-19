import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../quick-move-widget.svelte'
import InPane from './__fixtures__/in-320-pane.svelte'

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

	it('renders a group for each axis from the current positions', () => {
		renderSubject()

		expect(screen.getByRole('group', { name: 'Axis 0' })).toBeInTheDocument()
		expect(screen.getByRole('group', { name: 'Axis 1' })).toBeInTheDocument()
	})

	it('calls the moveToPosition mutation with the second axis moved up ten', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Axis 1, +10 mm' }))

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

		await userEvent.click(screen.getByRole('button', { name: 'Axis 0, −10 mm' }))

		expect(state.moveMutate).toHaveBeenCalledWith(
			[
				[1, 22],
				[50, 50],
			],
			{}
		)
	})

	it('renders the Quick move section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Quick move' })).toBeInTheDocument()
	})

	it("shows the move error in the section's error indicator", () => {
		state.error = new Error('gantry refused to move')

		renderSubject()

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})
})

describe('Gantry QuickMove widget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		render(InPane, { props: { widget: Subject } })

		expect(getComputedStyle(screen.getByTestId('pane')).width).toBe('320px')
	})

	it('does not scroll horizontally', () => {
		render(InPane, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(screen.getAllByRole('button', { name: /^Axis \d, [−+]10 mm$/u })).toHaveLength(4)
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
