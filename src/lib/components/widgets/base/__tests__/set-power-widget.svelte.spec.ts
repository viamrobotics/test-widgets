import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../set-power-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const { setPowerMutate } = vi.hoisted(() => ({
	setPowerMutate: vi.fn(),
}))

vi.mock('@viamrobotics/sdk', () => ({
	BaseClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: setPowerMutate,
		isPending: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-base' },
	})

describe('Base SetPower widget', () => {
	it('renders the SetPower section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'SetPower' })).toBeInTheDocument()
	})

	it('sends setPower with the default vectors when Execute is clicked', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(setPowerMutate).toHaveBeenCalledTimes(1)
		expect(setPowerMutate).toHaveBeenCalledWith(
			[
				{ x: 0.5, y: 0, z: 0 },
				{ x: 0, y: 0, z: 0.75 },
			],
			{}
		)
	})

	it("shows the setPower error in the section's error indicator", async () => {
		vi.mocked(createResourceMutation).mockReturnValue({
			mutate: setPowerMutate,
			isPending: false,
			error: new Error('base refused setPower'),
		} as never)

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'SetPower: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/base refused setPower/iu)).toBeInTheDocument()
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

describe('Base SetPower widget in a 320 px pane', () => {
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
