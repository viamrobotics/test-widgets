import { render, screen, within } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetLengthsWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const state = vi.hoisted(
	(): {
		data: number[] | undefined
		error: Error | null
		calls: { method: string; options: unknown }[]
	} => ({
		data: undefined,
		error: null,
		calls: [],
	})
)

vi.mock('@viamrobotics/sdk', () => ({
	GantryClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: unknown, options: unknown) => {
		state.calls.push({ method: String(method), options })
		return {
			get data() {
				return state.data
			},
			isLoading: false,
			get error() {
				return state.error
			},
		}
	}),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-gantry' },
	})

describe('Gantry GetLengths widget', () => {
	beforeEach(() => {
		state.data = [1000, 600, 1500]
		state.error = null
		state.calls = []
	})

	it('renders the GetLengths section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetLengths' })).toBeInTheDocument()
	})

	it('shows one readout per axis with its length in mm', () => {
		renderSubject()

		const axes = within(screen.getByRole('group', { name: 'Axis lengths' }))
		expect(axes.getByRole('group', { name: 'Axis 0' })).toHaveTextContent('1000.00 mm')
		expect(axes.getByRole('group', { name: 'Axis 1' })).toHaveTextContent('600.00 mm')
		expect(axes.getByRole('group', { name: 'Axis 2' })).toHaveTextContent('1500.00 mm')
	})

	it('draws no axis before the lengths arrive', () => {
		state.data = undefined

		renderSubject()

		expect(screen.queryByText('Axis 0')).not.toBeInTheDocument()
	})

	it('reads getLengths once, without polling', () => {
		renderSubject()

		expect(state.calls.filter(({ method }) => method === 'getLengths')).toEqual([
			{ method: 'getLengths', options: { refetchInterval: false } },
		])
	})

	it("shows the query error in the section's error indicator", () => {
		state.error = new Error('lengths unavailable')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'GetLengths: 1 error, copy to clipboard' })
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

describe('Gantry GetLengths widget in a 320 px pane', () => {
	beforeEach(() => {
		state.data = [1000, 600, 1500]
		state.error = null
		state.calls = []
	})

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
