import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../move-straight-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const { moveStraightMutate } = vi.hoisted(() => ({
	moveStraightMutate: vi.fn(),
}))

vi.mock('@viamrobotics/sdk', () => ({
	BaseClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: moveStraightMutate,
		isPending: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-base' },
	})

describe('Base MoveStraight widget', () => {
	it('renders the MoveStraight section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'MoveStraight' })).toBeInTheDocument()
	})

	it('sends moveStraight with the default distanceMm and mmPerSec when Execute is clicked', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(moveStraightMutate).toHaveBeenCalledTimes(1)
		expect(moveStraightMutate).toHaveBeenCalledWith([200, 100])
	})

	it("shows the moveStraight error in the section's error indicator", async () => {
		vi.mocked(createResourceMutation).mockReturnValue({
			mutate: moveStraightMutate,
			isPending: false,
			error: new Error('base refused moveStraight'),
		} as never)

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/base refused moveStraight/iu)).toBeInTheDocument()
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

describe('Base MoveStraight widget in a 320 px pane', () => {
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
