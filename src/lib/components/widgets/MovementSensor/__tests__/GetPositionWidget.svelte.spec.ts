import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetPositionWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const { queryState } = vi.hoisted(() => {
	const state: { data: unknown; error: Error | null } = {
		data: undefined,
		error: null,
	}
	return { queryState: state }
})

vi.mock('@viamrobotics/sdk', () => ({
	MovementSensorClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: queryState.data,
		isLoading: queryState.data === undefined && queryState.error === null,
		isError: queryState.error !== null,
		error: queryState.error,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-movement-sensor' },
	})

describe('MovementSensor GetPosition widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
		localStorage.clear()
	})

	it('renders the GetPosition section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetPosition' })).toBeInTheDocument()
	})

	it('renders the latitude to six decimals', () => {
		queryState.data = {
			coordinate: { latitude: 40.123_456_7, longitude: -73.654_321_9 },
			altitudeM: 12.5,
		}

		renderSubject()

		expect(screen.getByText('40.123457')).toBeInTheDocument()
	})

	it('renders the longitude to six decimals', () => {
		queryState.data = {
			coordinate: { latitude: 40.123_456_7, longitude: -73.654_321_9 },
			altitudeM: 12.5,
		}

		renderSubject()

		expect(screen.getByText('-73.654322')).toBeInTheDocument()
	})

	it('renders the altitude rounded to two decimals', () => {
		queryState.data = {
			coordinate: { latitude: 40.123_456_7, longitude: -73.654_321_9 },
			altitudeM: 12.5,
		}

		renderSubject()

		expect(screen.getByText('12.50')).toBeInTheDocument()
	})

	it('reads latitude and longitude as degrees and altitude as meters', () => {
		queryState.data = { coordinate: { latitude: 1, longitude: 2 }, altitudeM: 3 }

		renderSubject()

		expect(screen.getByRole('group', { name: 'Latitude' })).toHaveTextContent('1.000000 °')
		expect(screen.getByRole('group', { name: 'Longitude' })).toHaveTextContent('2.000000 °')
		expect(screen.getByRole('group', { name: 'Altitude' })).toHaveTextContent('3.00 m')
	})

	it('reads a dash for a missing coordinate', () => {
		queryState.data = { altitudeM: 3 }

		renderSubject()

		expect(screen.getByRole('group', { name: 'Latitude' }).textContent?.trim()).toBe('-')
	})

	it('polls getPosition every second until Pause is pressed', async () => {
		queryState.data = {
			coordinate: { latitude: 40.123_456_7, longitude: -73.654_321_9 },
			altitudeM: 12.5,
		}
		renderSubject()
		const options = (vi
			.mocked(createResourceQuery)
			.mock.calls.find(([, method]) => String(method) === 'getPosition') ?? [])[2]
		if (typeof options !== 'function')
			throw new Error('getPosition takes its options as a function')

		expect(options()).toEqual({ refetchInterval: 1000 })
		expect(screen.getByText('Updates')).toBeInTheDocument()

		await userEvent.click(screen.getByRole('button', { name: 'Pause' }))

		expect(options()).toEqual({ refetchInterval: false })
		expect(screen.getByText('Paused')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('position unavailable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetPosition: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/position unavailable/iu)).toBeInTheDocument()
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

describe('MovementSensor GetPosition widget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally', () => {
		queryState.data = {
			coordinate: { latitude: -73.654_321_9, longitude: -179.123_456_7 },
			altitudeM: 12_345.5,
		}
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
