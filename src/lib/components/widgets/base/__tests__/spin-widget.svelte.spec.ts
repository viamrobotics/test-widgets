import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../spin-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const { spinMutate } = vi.hoisted(() => ({
	spinMutate: vi.fn(),
}))

vi.mock('@viamrobotics/sdk', () => ({
	BaseClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: spinMutate,
		isPending: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-base' },
	})

describe('Base Spin widget', () => {
	it('renders the Spin section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Spin' })).toBeInTheDocument()
	})

	it('sends spin with the default angleDeg and degsPerSec when Execute is clicked', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(spinMutate).toHaveBeenCalledTimes(1)
		expect(spinMutate).toHaveBeenCalledWith([90, 45], {})
	})

	it("shows the spin error in the section's error indicator", async () => {
		vi.mocked(createResourceMutation).mockReturnValue({
			mutate: spinMutate,
			isPending: false,
			error: new Error('base refused spin'),
		} as never)

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'Spin: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/base refused spin/iu)).toBeInTheDocument()
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

describe('Base Spin widget in a 320 px pane', () => {
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
