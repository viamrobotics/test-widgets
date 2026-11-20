import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../move-to-position-widget.svelte'
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

describe('Gantry MoveToPosition widget', () => {
	beforeEach(() => {
		state.moveMutate = vi.fn()
		state.error = null
	})

	it('fills the Position inputs from the current positions', () => {
		renderSubject()

		const inputs = screen.getAllByRole('spinbutton', { name: /^position/iu })

		expect(inputs[0]).toHaveValue(11)
		expect(inputs[1]).toHaveValue(22)
	})

	it('calls the moveToPosition mutation with the edited position, the live position for the rest, and default speeds', async () => {
		renderSubject()

		const input = screen.getAllByRole('spinbutton', { name: /^position/iu })[0]!
		await userEvent.clear(input)
		await userEvent.click(input)
		await userEvent.keyboard('77{Enter}')
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.moveMutate).toHaveBeenCalledWith(
			[
				[77, 22],
				[50, 50],
			],
			{}
		)
	})

	it('renders the MoveToPosition section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'MoveToPosition' })).toBeInTheDocument()
	})

	it("shows the move error in the section's error indicator", () => {
		state.error = new Error('gantry refused to move')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'MoveToPosition: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})

describe('Gantry MoveToPosition widget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		render(InPane, { props: { widget: Subject } })

		expect(getComputedStyle(screen.getByTestId('pane')).width).toBe('320px')
	})

	it('does not scroll horizontally', () => {
		render(InPane, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(screen.getAllByRole('spinbutton')).toHaveLength(4)
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
