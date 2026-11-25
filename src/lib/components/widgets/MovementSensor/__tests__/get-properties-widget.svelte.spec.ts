import { render, screen, within } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-properties-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const PANE_WIDTH = '320px'

const state = vi.hoisted(
	(): {
		data: Record<string, boolean> | undefined
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

const PROPERTIES = {
	positionSupported: true,
	orientationSupported: true,
	compassHeadingSupported: true,
	linearVelocitySupported: true,
	angularVelocitySupported: false,
	linearAccelerationSupported: false,
}

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-movement-sensor' } })

describe('MovementSensor GetProperties widget', () => {
	beforeEach(() => {
		state.data = PROPERTIES
		state.error = null
		state.queries = []
	})

	it('renders the GetProperties section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetProperties' })).toBeInTheDocument()
	})

	it('reads the properties once, with no poll note', () => {
		renderSubject()

		const query = state.queries.find(({ method }) => String(method) === 'getProperties')
		expect(query?.options).toEqual({ refetchInterval: false })
		expect(screen.queryByText('Updates automatically')).not.toBeInTheDocument()
	})

	it('draws one row per method in the board order', () => {
		renderSubject()

		const rows = within(screen.getByRole('group', { name: 'Supported methods' }))
		expect(rows.getAllByRole('group').map((group) => group.textContent?.trim())).toEqual([
			'Supported',
			'Supported',
			'Supported',
			'Supported',
			'Not supported',
			'Not supported',
		])
		expect(screen.getByRole('group', { name: 'Linear acceleration' })).toHaveTextContent(
			'Not supported'
		)
	})

	it('marks a supported method with a dot and an unsupported one with a different dot', () => {
		renderSubject()

		expect(screen.getByRole('img', { name: 'Position' })).toBeInTheDocument()
		expect(screen.getByRole('img', { name: 'Angular velocity' })).toBeInTheDocument()
	})

	it('reads a dash and no dot before the properties arrive', () => {
		state.data = undefined

		renderSubject()

		expect(screen.getByRole('group', { name: 'Position' }).textContent?.trim()).toBe('-')
		expect(screen.queryByRole('img')).not.toBeInTheDocument()
	})

	it("shows the query error in the section's error indicator", () => {
		state.error = new Error('properties unavailable')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'GetProperties: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})

describe('MovementSensor GetProperties widget in a 320 px pane', () => {
	beforeEach(() => {
		state.data = PROPERTIES
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
