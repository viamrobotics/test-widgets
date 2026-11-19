import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../stop-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const { stopMutate, mutationState } = vi.hoisted(() => {
	const state: { error: Error | null } = { error: null }
	return { stopMutate: vi.fn(), mutationState: state }
})

vi.mock('@viamrobotics/sdk', () => ({
	ArmClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: stopMutate,
		isPending: false,
		error: mutationState.error,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-arm' },
	})

describe('Arm Stop widget', () => {
	beforeEach(() => {
		stopMutate.mockClear()
		mutationState.error = null
	})

	it('renders the Stop section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Stop' })).toBeInTheDocument()
	})

	it('sends stop when the button is clicked', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: /^stop$/iu }))

		expect(stopMutate).toHaveBeenCalledTimes(1)
		expect(stopMutate).toHaveBeenCalledWith([])
	})

	it("shows the stop error in the section's error indicator", async () => {
		mutationState.error = new Error('arm refused to stop')

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/arm refused to stop/iu)).toBeInTheDocument()
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

describe('Arm Stop widget in a 320 px pane', () => {
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
