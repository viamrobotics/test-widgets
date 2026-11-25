import '../../../../../app.css'

import { render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-properties-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const PANE_WIDTH = '320px'

const state = vi.hoisted(
	(): {
		data: { ticksCountSupported: boolean; angleDegreesSupported: boolean } | undefined
		error: Error | null
		queries: { method: string; options: unknown }[]
	} => ({ data: undefined, error: null, queries: [] })
)

vi.mock('@viamrobotics/sdk', () => ({
	EncoderClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: string, options: unknown) => {
		state.queries.push({ method, options })
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
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-encoder' } })

describe('Encoder GetProperties widget', () => {
	beforeEach(() => {
		state.data = { ticksCountSupported: true, angleDegreesSupported: false }
		state.error = null
		state.queries = []
	})

	it('renders the GetProperties section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetProperties' })).toBeInTheDocument()
	})

	it('reads getProperties once, with no poll', () => {
		renderSubject()

		const query = state.queries.find(({ method }) => String(method) === 'getProperties')
		expect(query?.options).toEqual({ refetchInterval: false })
	})

	it('shows Supported for ticks and Not supported for angle', () => {
		renderSubject()

		expect(screen.getByText('Ticks count')).toBeInTheDocument()
		expect(screen.getByText('Angle degrees')).toBeInTheDocument()
		expect(screen.getByText('Supported')).toBeInTheDocument()
		expect(screen.getByText('Not supported')).toBeInTheDocument()
	})

	it('names each value by its label in a group', () => {
		renderSubject()

		expect(screen.getByRole('group', { name: 'Ticks count' })).toHaveTextContent('Supported')
		expect(screen.getByRole('group', { name: 'Angle degrees' })).toHaveTextContent('Not supported')
	})

	it('names each dot for its concept, not for its value', () => {
		renderSubject()

		expect(screen.getByRole('img', { name: 'Ticks count' })).toBeInTheDocument()
		expect(screen.getByRole('img', { name: 'Angle degrees' })).toBeInTheDocument()
	})

	it('shows both flags as Supported', () => {
		state.data = { ticksCountSupported: true, angleDegreesSupported: true }

		renderSubject()

		expect(screen.getAllByText('Supported')).toHaveLength(2)
		expect(screen.queryByText('Not supported')).not.toBeInTheDocument()
	})

	it('shows a dash for each flag before the properties arrive', () => {
		state.data = undefined

		renderSubject()

		expect(screen.getAllByText('-')).toHaveLength(2)
	})

	it("shows the query error in the section's error indicator", () => {
		state.error = new Error('properties unavailable')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'GetProperties: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})

describe('Encoder GetProperties widget in a 320 px pane', () => {
	beforeEach(() => {
		state.data = { ticksCountSupported: true, angleDegreesSupported: true }
		state.error = null
	})

	it('does not scroll horizontally', () => {
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
