import '../../../../../app.css'

import { render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../position-map.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

interface QueryState {
	data: unknown
	error: Error | null
}

const { queryStates, queryOptions } = vi.hoisted(() => ({
	queryStates: new Map<string, QueryState>(),
	queryOptions: new Map<string, unknown>(),
}))

vi.mock('@viamrobotics/prime-map', async () => {
	const [center, follow, map, satellite] = await Promise.all([
		import('./__fixtures__/center-stub.svelte'),
		import('./__fixtures__/follow-stub.svelte'),
		import('./__fixtures__/map-stub.svelte'),
		import('./__fixtures__/satellite-stub.svelte'),
	])
	return {
		CenterControls: center.default,
		DirectionalMarker: () => {},
		FollowControls: follow.default,
		MapLibre: map.default,
		MapLibreMarker: () => {},
		MapProviders: { googleMaps: 'google-maps' },
		SatelliteControls: satellite.default,
	}
})

vi.mock('@viamrobotics/sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/sdk')>()),
	MovementSensorClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: string, options: unknown) => {
		queryOptions.set(method, options)
		return {
			get data() {
				return queryStates.get(method)?.data
			},
			get error() {
				return queryStates.get(method)?.error ?? null
			},
			get isLoading() {
				const state = queryStates.get(method)
				return state === undefined || (state.data === undefined && state.error === null)
			},
			isSuccess: false,
			isError: false,
			refetch: vi.fn(),
		}
	}),
}))

const resolvedOptions = (method: string) => {
	const options = queryOptions.get(method)
	return typeof options === 'function' ? options() : options
}

const seed = (properties: Record<string, boolean>) => {
	queryStates.set('getProperties', { data: properties, error: null })
	queryStates.set('getPosition', {
		data: { coordinate: { latitude: 40.5, longitude: -73.25 }, altitudeM: 12 },
		error: null,
	})
	queryStates.set('getCompassHeading', { data: 90, error: null })
}

const renderSubject = () => render(PaneSubject, { props: { widget: Subject } })

describe('MovementSensor PositionMap widget', () => {
	beforeEach(() => {
		queryStates.clear()
		queryOptions.clear()
	})

	it('reads getProperties once and polls position and heading every 500 ms', () => {
		seed({ positionSupported: true, compassHeadingSupported: true })
		renderSubject()

		expect(queryOptions.get('getProperties')).toEqual({ refetchInterval: false })
		expect(resolvedOptions('getPosition')).toEqual({ enabled: true, refetchInterval: 500 })
		expect(resolvedOptions('getCompassHeading')).toEqual({ enabled: true, refetchInterval: 500 })
	})

	it('draws Follow, Center, and Satellite inside the Map view folder over the map', () => {
		seed({ positionSupported: true, compassHeadingSupported: true })
		renderSubject()

		const map = screen.getByRole('region', { name: 'Map' })
		expect(screen.getByRole('heading', { name: 'Map' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Map view', expanded: true })).toBeInTheDocument()
		expect(map).toContainElement(screen.getByLabelText('Map view panel'))
		expect(screen.getByText('Follow')).toBeVisible()
		expect(screen.getByText('Center')).toBeVisible()
		expect(screen.getByText('Satellite')).toBeVisible()
	})

	it('takes the full pane width at 4:3', () => {
		seed({ positionSupported: true, compassHeadingSupported: false })
		renderSubject()

		const rect = screen.getByRole('region', { name: 'Map' }).getBoundingClientRect()
		const pane = screen.getByTestId('pane').getBoundingClientRect()
		expect(rect.width).toBeGreaterThan(0)
		expect(rect.width).toBeLessThanOrEqual(pane.width)
		expect(rect.height).toBeCloseTo((rect.width * 3) / 4, 0)
	})

	it('draws no map and no heading poll when position is unsupported', () => {
		seed({ positionSupported: false, compassHeadingSupported: false })
		renderSubject()

		expect(screen.getByText('Not supported')).toBeInTheDocument()
		expect(screen.queryByRole('region', { name: 'Map' })).not.toBeInTheDocument()
		expect(resolvedOptions('getPosition')).toMatchObject({ enabled: false })
		expect(resolvedOptions('getCompassHeading')).toMatchObject({ enabled: false })
	})

	it('shows a failing GetPosition on the section indicator', async () => {
		seed({ positionSupported: true, compassHeadingSupported: false })
		queryStates.set('getPosition', { data: undefined, error: new Error('position failed') })
		renderSubject()

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /error/i })).toBeInTheDocument()
		})
	})
})
