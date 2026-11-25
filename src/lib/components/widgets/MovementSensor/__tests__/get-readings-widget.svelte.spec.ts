import { render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-readings-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const PANE_WIDTH = '320px'
const POLL_INTERVAL_MS = 500

const state = vi.hoisted(
	(): {
		data: Record<string, unknown> | undefined
		error: Error | null
		queries: { method: string; options: unknown }[]
	} => ({ data: undefined, error: null, queries: [] })
)

vi.mock('@viamrobotics/sdk', () => ({
	MovementSensorClient: class {},
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
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-movement-sensor' } })

describe('MovementSensor GetReadings widget', () => {
	beforeEach(() => {
		state.data = { volts: 12.04, amps: 0.82 }
		state.error = null
		state.queries = []
	})

	it('renders the GetReadings section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetReadings' })).toBeInTheDocument()
	})

	it('polls getReadings every 500 ms', () => {
		renderSubject()

		const query = state.queries.find(({ method }) => String(method) === 'getReadings')
		expect(query?.options).toEqual({ refetchInterval: POLL_INTERVAL_MS })
		expect(screen.getByText('Updates automatically')).toBeInTheDocument()
	})

	it('lists the readings by key', () => {
		renderSubject()

		expect(screen.getAllByRole('term').map((term) => term.textContent?.trim())).toEqual([
			'amps',
			'volts',
		])
	})

	it('offers Copy JSON once there is data', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument()
	})

	it('shows a dash and no Copy JSON before the readings arrive', () => {
		state.data = undefined

		renderSubject()

		expect(screen.getByRole('group', { name: 'Readings' })).toHaveTextContent('-')
		expect(screen.queryByRole('button', { name: 'Copy JSON' })).not.toBeInTheDocument()
	})

	it("shows the query error in the section's error indicator", () => {
		state.error = new Error('readings unavailable')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'GetReadings: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})

describe('MovementSensor GetReadings widget in a 320 px pane', () => {
	beforeEach(() => {
		state.data = { volts: 12.04, amps: 0.82 }
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
