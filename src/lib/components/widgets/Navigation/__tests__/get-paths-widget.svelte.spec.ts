import { render, screen, within } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-paths-widget.svelte'
import Pane from './__fixtures__/in-320-pane.svelte'

interface PathData {
	destinationWaypointId: string
	geopoints: { latitude: number; longitude: number }[]
}

interface WaypointData {
	id: string
}

const { queryState } = vi.hoisted(() => ({
	queryState: {
		paths: undefined as PathData[] | undefined,
		waypoints: undefined as WaypointData[] | undefined,
		isError: false,
		error: null as Error | null,
		waypointsError: null as Error | null,
	},
}))

vi.mock('@viamrobotics/sdk', () => ({
	NavigationClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: string | symbol | number) => {
		const isPaths = String(method) === 'getPaths'
		return {
			data: isPaths ? queryState.paths : queryState.waypoints,
			isLoading: false,
			isError: isPaths ? queryState.isError : queryState.waypointsError !== null,
			error: isPaths ? queryState.error : queryState.waypointsError,
		}
	}),
}))

const point = { latitude: 1, longitude: 2 }

const pathTo = (destinationWaypointId: string, pointCount: number): PathData => ({
	destinationWaypointId,
	geopoints: Array.from({ length: pointCount }, () => point),
})

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-nav' } })

describe('Navigation GetPaths widget', () => {
	beforeEach(() => {
		queryState.paths = undefined
		queryState.waypoints = undefined
		queryState.isError = false
		queryState.error = null
		queryState.waypointsError = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetPaths heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetPaths' })).toBeInTheDocument()
	})

	it('shows each path under its destination waypoint label with its point count', () => {
		queryState.waypoints = [{ id: 'wp-a' }, { id: 'wp-b' }]
		queryState.paths = [pathTo('wp-b', 14), pathTo('wp-a', 9)]

		renderSubject()

		const rows = within(screen.getByRole('list', { name: 'Paths' })).getAllByRole('listitem')
		expect(rows).toHaveLength(2)
		expect(rows[0]).toMatchTextContent('Waypoint 2')
		expect(rows[1]).toMatchTextContent('Waypoint 1')
		const first = within(screen.getByRole('group', { name: 'Waypoint 2' }))
		expect(first.getByText('14')).toBeInTheDocument()
		expect(first.getByText('points')).toBeInTheDocument()
		expect(
			within(screen.getByRole('group', { name: 'Waypoint 1' })).getByText('9')
		).toBeInTheDocument()
	})

	it('falls back to the waypoint id when the waypoint is unknown', () => {
		queryState.waypoints = []
		queryState.paths = [pathTo('wp-missing', 3)]

		renderSubject()

		expect(screen.getByRole('group', { name: 'wp-missing' })).toBeInTheDocument()
	})

	it('reads - with no unit when there are no paths', () => {
		queryState.paths = []

		renderSubject()

		const group = screen.getByRole('group', { name: 'Paths' })
		expect(within(group).getByText('-')).toBeInTheDocument()
		expect(screen.queryByText('points')).not.toBeInTheDocument()
		expect(screen.getByText('Updates automatically')).toHaveClass('mt-auto')
	})

	it('polls getPaths every 1000 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getPaths', {
			refetchInterval: 1000,
		})
	})

	it('shows the query error in the section indicator', () => {
		queryState.isError = true
		queryState.error = new Error('navigation unreachable')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'GetPaths: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})

	it('shows the waypoints query error in the section indicator', () => {
		queryState.waypointsError = new Error('waypoints unreachable')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'GetPaths: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})

describe('Navigation GetPaths widget in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		queryState.waypoints = [{ id: 'wp-a' }]
		queryState.paths = [pathTo('wp-a', 14)]

		render(Pane, { props: { widget: Subject } })

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? pane
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
