import '../../../../../app.css'

import { render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../PositionMap.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

interface QueryState {
	data: unknown
	error: Error | null
}

const { queryStates, queryOptions, directionalCalls, plainCalls } = vi.hoisted(() => ({
	queryStates: new Map<string, QueryState>(),
	queryOptions: new Map<string, unknown>(),
	directionalCalls: [] as { lat: number; lng: number; rotation: number }[],
	plainCalls: [] as { lat: number; lng: number }[],
}))

vi.mock('@viamrobotics/prime-map', async () => {
	const [center, follow, map, satellite] = await Promise.all([
		import('./__fixtures__/CenterStub.svelte'),
		import('./__fixtures__/FollowStub.svelte'),
		import('./__fixtures__/MapStub.svelte'),
		import('./__fixtures__/SatelliteStub.svelte'),
	])
	return {
		CenterControls: center.default,
		DirectionalMarker: (
			_anchor: unknown,
			props: { lat: number; lng: number; rotation: number }
		) => {
			directionalCalls.push({ lat: props.lat, lng: props.lng, rotation: props.rotation })
		},
		FollowControls: follow.default,
		MapLibre: map.default,
		MapLibreMarker: (_anchor: unknown, props: { lat: number; lng: number }) => {
			plainCalls.push({ lat: props.lat, lng: props.lng })
		},
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
		directionalCalls.length = 0
		plainCalls.length = 0
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

	it('sends no heading read for a compass-only sensor', () => {
		seed({ positionSupported: false, compassHeadingSupported: true })
		renderSubject()

		expect(resolvedOptions('getCompassHeading')).toMatchObject({ enabled: false })
	})

	it('draws a directional marker with the heading when one is read', () => {
		seed({ positionSupported: true, compassHeadingSupported: true })
		renderSubject()

		expect(directionalCalls.at(-1)).toEqual({ lat: 40.5, lng: -73.25, rotation: 90 })
		expect(plainCalls).toHaveLength(0)
	})

	it('draws a plain marker without a heading', () => {
		seed({ positionSupported: true, compassHeadingSupported: false })
		renderSubject()

		expect(plainCalls.at(-1)).toEqual({ lat: 40.5, lng: -73.25 })
		expect(directionalCalls).toHaveLength(0)
	})

	it('draws no marker for a NaN coordinate', () => {
		seed({ positionSupported: true, compassHeadingSupported: true })
		queryStates.set('getPosition', {
			data: { coordinate: { latitude: Number.NaN, longitude: -73.25 }, altitudeM: 12 },
			error: null,
		})
		renderSubject()

		expect(directionalCalls).toHaveLength(0)
		expect(plainCalls).toHaveLength(0)
	})

	it('disables the Center fieldset while Follow is on', () => {
		seed({ positionSupported: true, compassHeadingSupported: false })
		renderSubject()

		expect(screen.getByText('Center').closest('fieldset')).toHaveAttribute('disabled')
	})
})
