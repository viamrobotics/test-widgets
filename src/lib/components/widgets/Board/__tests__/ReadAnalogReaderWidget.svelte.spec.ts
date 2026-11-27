import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../ReadAnalogReaderWidget.svelte'
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

const getReading = async (reader: string) => {
	await userEvent.type(screen.getByRole('textbox', { name: 'Analog reader' }), reader)
	await userEvent.click(screen.getByRole('button', { name: 'Get' }))
}

const valueOf = (name: string) => screen.getByRole('group', { name }).querySelector('output')

describe('Board ReadAnalogReader widget', () => {
	beforeEach(() => {
		state.mutateAsync = vi.fn()
		state.error = null
	})

	it('renders the ReadAnalogReader section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'ReadAnalogReader' })).toBeInTheDocument()
	})

	it('reads - until a reading arrives, and keeps Get disabled without a name', () => {
		renderSubject()

		expect(valueOf('Value')?.textContent?.trim()).toBe('-')
		expect(screen.getByRole('button', { name: 'Get' })).toBeDisabled()
	})

	it('sends the reader name and shows the value, range, and step size', async () => {
		state.mutateAsync.mockResolvedValue({ value: 512, minRange: 0, maxRange: 1023, stepSize: 1 })
		renderSubject()

		await getReading('a1')

		expect(state.mutateAsync).toHaveBeenCalledWith('readAnalogReader', ['a1'])
		expect(await screen.findByText('512')).toBeInTheDocument()
		expect(screen.getByRole('group', { name: 'Range' }).textContent).toContain('1023')
		expect(valueOf('Step size')?.textContent?.trim()).toBe('1')
	})

	it('clears the reading when the reader name changes', async () => {
		state.mutateAsync.mockResolvedValue({ value: 512, minRange: 0, maxRange: 1023, stepSize: 1 })
		renderSubject()

		await getReading('a1')
		expect(await screen.findByText('512')).toBeInTheDocument()
		await userEvent.type(screen.getByRole('textbox', { name: 'Analog reader' }), '2')

		expect(valueOf('Value')?.textContent?.trim()).toBe('-')
		expect(screen.queryByRole('group', { name: 'Range' })).not.toBeInTheDocument()
	})

	it('draws no range when the reader has none', async () => {
		state.mutateAsync.mockResolvedValue({ value: 3, minRange: 0, maxRange: 0, stepSize: 1 })
		renderSubject()

		await getReading('a2')

		expect(await screen.findByText('3')).toBeInTheDocument()
		expect(screen.queryByRole('group', { name: 'Range' })).not.toBeInTheDocument()
	})

	it("shows the read error in the section's error indicator", () => {
		state.error = new Error('no such reader')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'ReadAnalogReader: 1 error, copy to clipboard' })
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

describe('Board ReadAnalogReader widget in a 320 px pane', () => {
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
