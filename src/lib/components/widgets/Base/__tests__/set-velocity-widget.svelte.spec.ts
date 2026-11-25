import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import Subject from '../set-velocity-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const { setVelocityMutate } = vi.hoisted(() => ({
	setVelocityMutate: vi.fn(),
}))

vi.mock('@viamrobotics/sdk', () => ({
	BaseClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutateAsync: setVelocityMutate,
		isPending: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(InWidgetsProvider, {
		props: { component: Subject, props: { partID: 'test-part', resourceName: 'test-base' } },
	})

describe('Base SetVelocity widget', () => {
	it('renders the SetVelocity section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'SetVelocity' })).toBeInTheDocument()
	})

	it('sends setVelocity with the default vectors when Execute is clicked', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(setVelocityMutate).toHaveBeenCalledTimes(1)
		expect(setVelocityMutate).toHaveBeenCalledWith([
			{ x: 0, y: 50, z: 0 },
			{ x: 0, y: 0, z: 15 },
		])
	})

	it("shows the setVelocity error in the section's error indicator", async () => {
		vi.mocked(createResourceMutation).mockReturnValue({
			mutateAsync: setVelocityMutate,
			isPending: false,
			error: new Error('base refused setVelocity'),
		} as never)

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'SetVelocity: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/base refused setVelocity/iu)).toBeInTheDocument()
	})
})

const PANE_WIDTH = '320px'

const renderInPane = () => {
	render(PaneSubject, { props: { widget: Subject } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

describe('Base SetVelocity widget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally', () => {
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
