import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../GetDigitalInterruptValueWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const state = vi.hoisted((): { mutateAsync: Mock; mutate: Mock; error: Error | null } => ({
	mutateAsync: vi.fn(),
	mutate: vi.fn(),
	error: null,
}))

vi.mock('@viamrobotics/sdk', () => ({
	BoardClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn((_client: unknown, method: string) => ({
		mutate: (...args: unknown[]) => state.mutate(method, ...args),
		mutateAsync: (...args: unknown[]) => state.mutateAsync(method, ...args),
		isPending: false,
		get error() {
			return state.error
		},
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-board' },
	})

describe('Board GetDigitalInterruptValue widget', () => {
	beforeEach(() => {
		state.mutateAsync = vi.fn()
		state.error = null
	})

	it('renders the GetDigitalInterruptValue section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetDigitalInterruptValue' })).toBeInTheDocument()
	})

	it('reads - until a value arrives, and keeps Get disabled without a name', () => {
		renderSubject()

		expect(screen.getByRole('group', { name: 'Value' }).textContent).toContain('-')
		expect(screen.getByRole('button', { name: 'Get' })).toBeDisabled()
	})

	it('sends the interrupt name and shows the count', async () => {
		state.mutateAsync.mockResolvedValue(1284)
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Digital interrupt' }), 'd1')
		await userEvent.click(screen.getByRole('button', { name: 'Get' }))

		expect(state.mutateAsync).toHaveBeenCalledWith('getDigitalInterruptValue', ['d1'])
		expect(await screen.findByText('1284')).toBeInTheDocument()
	})

	it('clears the count when the interrupt name changes', async () => {
		state.mutateAsync.mockResolvedValue(1284)
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Digital interrupt' }), 'd1')
		await userEvent.click(screen.getByRole('button', { name: 'Get' }))
		expect(await screen.findByText('1284')).toBeInTheDocument()
		await userEvent.type(screen.getByRole('textbox', { name: 'Digital interrupt' }), '2')

		expect(screen.getByRole('group', { name: 'Value' }).textContent).toContain('-')
		expect(screen.queryByText('1284')).not.toBeInTheDocument()
	})

	it("shows the read error in the section's error indicator", () => {
		state.error = new Error('no such interrupt')

		renderSubject()

		expect(
			screen.getByRole('button', {
				name: 'GetDigitalInterruptValue: 1 error, copy to clipboard',
			})
		).toBeInTheDocument()
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

describe('Board GetDigitalInterruptValue widget in a 320 px pane', () => {
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
