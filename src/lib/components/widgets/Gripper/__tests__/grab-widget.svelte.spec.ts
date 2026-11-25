import { fireEvent, render, screen, within } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import Subject from '../grab-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted(
	(): { grabMutate: Mock; error: Error | null; data: boolean | undefined } => ({
		grabMutate: vi.fn(),
		error: null,
		data: undefined,
	})
)

vi.mock('@viamrobotics/sdk', () => ({
	GripperClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutateAsync: state.grabMutate,
		isPending: false,
		get data() {
			return state.data
		},
		get error() {
			return state.error
		},
	})),
}))

const renderSubject = () =>
	render(InWidgetsProvider, {
		props: { component: Subject, props: { partID: 'test-part', resourceName: 'test-gripper' } },
	})

describe('Gripper Grab widget', () => {
	beforeEach(() => {
		state.grabMutate.mockClear()
		state.error = null
		state.data = undefined
	})

	it('renders the Grab section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Grab' })).toBeInTheDocument()
	})

	it('sends grab when the button is clicked', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: 'Grab' }))

		expect(state.grabMutate).toHaveBeenCalledTimes(1)
		expect(state.grabMutate).toHaveBeenCalledWith([])
	})

	it('reads Grabbed as a dash with no status dot before a run', () => {
		renderSubject()

		const readout = screen.getByRole('group', { name: 'Grabbed' })
		expect(readout).toHaveTextContent('-')
		expect(within(readout).queryByRole('img')).not.toBeInTheDocument()
	})

	it('reads Grabbed as Yes with a success dot when Grab returns true', () => {
		state.data = true

		renderSubject()

		const readout = screen.getByRole('group', { name: 'Grabbed' })
		expect(readout).toHaveTextContent('Yes')
		expect(within(readout).getByLabelText('Grabbed')).toBeInTheDocument()
	})

	it('reads Grabbed as No when Grab returns false', () => {
		state.data = false

		renderSubject()

		expect(screen.getByRole('group', { name: 'Grabbed' })).toHaveTextContent('No')
	})

	it('draws Grab as a compact button', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'Grab' })).toHaveClass('button-compact')
	})

	it("shows the grab error in the section's error indicator", async () => {
		state.error = new Error('gripper refused to grab')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'Grab: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/gripper refused to grab/iu)).toBeInTheDocument()
	})
})

const renderInPane = () => {
	render(PaneSubject, { props: { widget: Subject } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

describe('Gripper Grab widget in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		const { pane, root } = renderInPane()

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
