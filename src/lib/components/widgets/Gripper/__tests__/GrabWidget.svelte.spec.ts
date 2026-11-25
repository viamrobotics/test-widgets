import { fireEvent, render, screen } from '@testing-library/svelte'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../GrabWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const state = vi.hoisted((): { grabMutate: Mock; error: Error | null } => ({
	grabMutate: vi.fn(),
	error: null,
}))

vi.mock('@viamrobotics/sdk', () => ({
	GripperClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutateAsync: state.grabMutate,
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

describe('Gripper Grab widget', () => {
	beforeEach(() => {
		state.grabMutate.mockReset()
		state.error = null
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

	it('says Grab finished when Grab returns', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: 'Grab' }))

		expect(await screen.findByText('Grab finished')).toBeInTheDocument()
	})

	it('keeps Grab focusable and says why while its call is in flight', async () => {
		state.grabMutate.mockReturnValue(new Promise(() => {}))
		renderSubject()
		const button = screen.getByRole('button', { name: 'Grab' })

		await fireEvent.click(button)

		expect(await screen.findByText('Grabbing')).toBeInTheDocument()
		expect(button).not.toHaveAttribute('disabled')
		expect(button).toHaveAttribute('aria-disabled', 'true')
		expect(button).toHaveAccessibleDescription('Wait for the gripper to finish moving.')
	})

	it('sends nothing for a second press while its call is in flight', async () => {
		state.grabMutate.mockReturnValue(new Promise(() => {}))
		renderSubject()
		const button = screen.getByRole('button', { name: 'Grab' })
		await fireEvent.click(button)
		await screen.findByText('Grabbing')

		await fireEvent.click(button)

		expect(state.grabMutate).toHaveBeenCalledTimes(1)
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
