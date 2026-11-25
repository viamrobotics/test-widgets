import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import Subject from '../open-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted((): { openMutate: Mock; error: Error | null } => ({
	openMutate: vi.fn(),
	error: null,
}))

vi.mock('@viamrobotics/sdk', () => ({
	GripperClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutateAsync: state.openMutate,
		isPending: false,
		get error() {
			return state.error
		},
	})),
}))

const renderSubject = () =>
	render(InWidgetsProvider, {
		props: { component: Subject, props: { partID: 'test-part', resourceName: 'test-gripper' } },
	})

describe('Gripper Open widget', () => {
	beforeEach(() => {
		state.openMutate.mockClear()
		state.error = null
	})

	it('renders the Open section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Open' })).toBeInTheDocument()
	})

	it('sends open when the button is clicked', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: 'Open' }))

		expect(state.openMutate).toHaveBeenCalledTimes(1)
		expect(state.openMutate).toHaveBeenCalledWith([])
	})

	it('draws Open as a compact button', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'Open' })).toHaveClass('button-compact')
	})

	it("shows the open error in the section's error indicator", async () => {
		state.error = new Error('gripper refused to open')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'Open: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/gripper refused to open/iu)).toBeInTheDocument()
	})
})

const renderInPane = () => {
	render(PaneSubject, { props: { widget: Subject } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

describe('Gripper Open widget in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		const { pane, root } = renderInPane()

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
