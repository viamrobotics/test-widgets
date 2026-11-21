import '../../../../../app.css'

import { render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../movement-sensor-controls.svelte'

interface QueryState {
	data: unknown
	error: Error | null
}

const { queryStates, queryOptions } = vi.hoisted(() => ({
	queryStates: new Map<string, QueryState>(),
	queryOptions: new Map<string, unknown>(),
}))

vi.mock('$lib/components/maplibre', async () => {
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

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
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
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const resolvedOptions = (method: string) => {
	const options = queryOptions.get(method)
	return typeof options === 'function' ? options() : options
}

const properties = (overrides: Record<string, boolean> = {}) => ({
	positionSupported: true,
	orientationSupported: false,
	compassHeadingSupported: true,
	angularVelocitySupported: false,
	linearVelocitySupported: true,
	linearAccelerationSupported: false,
	...overrides,
})

const seed = (props: ReturnType<typeof properties>) => {
	queryStates.set('getProperties', { data: props, error: null })
	queryStates.set('getPosition', {
		data: { coordinate: { latitude: 40.5, longitude: -73.25 }, altitudeM: 12 },
		error: null,
	})
	queryStates.set('getCompassHeading', { data: 90, error: null })
	queryStates.set('getLinearVelocity', { data: { x: 1, y: 2, z: 3 }, error: null })
	queryStates.set('getAccuracy', {
		data: { positionNmeaGgaFix: 4, positionHdop: 0.8, accuracy: {} },
		error: null,
	})
}

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-movement-sensor' } })

const labelsInOrder = () =>
	screen
		.getAllByRole('group')
		.map((group) => group.getAttribute('aria-labelledby'))
		.filter((id) => id !== null)
		.map((id) => document.querySelector(`[id="${id}"]`)?.textContent.trim())

describe('MovementSensor Controls', () => {
	beforeEach(() => {
		queryStates.clear()
		queryOptions.clear()
	})

	it('reads getProperties once and polls on the board cadence', () => {
		seed(properties())
		renderSubject()

		expect(queryOptions.get('getProperties')).toEqual({ refetchInterval: false })
		expect(resolvedOptions('getPosition')).toMatchObject({ refetchInterval: 500 })
		expect(resolvedOptions('getCompassHeading')).toMatchObject({ refetchInterval: 500 })
		expect(resolvedOptions('getLinearVelocity')).toMatchObject({ refetchInterval: 500 })
		expect(resolvedOptions('getAccuracy')).toMatchObject({ refetchInterval: 5000 })
		expect(queryOptions.has('getOrientation')).toBe(false)
		expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument()
	})

	it('draws every readout in order when all are supported', () => {
		seed(properties())
		renderSubject()

		expect(labelsInOrder()).toEqual([
			'Latitude',
			'Longitude',
			'Altitude',
			'Heading',
			'X',
			'Y',
			'Z',
			'Fix quality',
			'HDOP',
		])
		expect(screen.getByRole('region', { name: 'Map' })).toBeInTheDocument()
		expect(screen.getByText('Linear velocity')).toBeInTheDocument()
		expect(screen.getByText('RTK')).toBeInTheDocument()
		expect(screen.getByText('0.80')).toBeInTheDocument()
	})

	it('draws Follow, Center, and Satellite inside the Map view folder over the map', () => {
		seed(properties())
		renderSubject()

		const map = screen.getByRole('region', { name: 'Map' })
		expect(screen.getByRole('button', { name: 'Map view', expanded: true })).toBeInTheDocument()
		expect(map).toContainElement(screen.getByLabelText('Map view panel'))
		expect(screen.getByText('Follow')).toBeVisible()
		expect(screen.getByText('Center')).toBeVisible()
		expect(screen.getByText('Satellite')).toBeVisible()
	})

	it('drops the map and position readouts when position is unsupported', () => {
		seed(properties({ positionSupported: false }))
		renderSubject()

		expect(screen.getByText('Not supported')).toBeInTheDocument()
		expect(screen.queryByText('Latitude')).not.toBeInTheDocument()
		expect(screen.queryByText('Altitude')).not.toBeInTheDocument()
		expect(screen.queryByRole('region', { name: 'Map' })).not.toBeInTheDocument()
		expect(screen.getByText('Heading')).toBeInTheDocument()
	})

	it('drops Heading when compass heading is unsupported', () => {
		seed(properties({ compassHeadingSupported: false }))
		renderSubject()

		expect(screen.queryByText('Heading')).not.toBeInTheDocument()
		expect(screen.getByText('Latitude')).toBeInTheDocument()
	})

	it('drops the linear velocity row when it is unsupported', () => {
		seed(properties({ linearVelocitySupported: false }))
		renderSubject()

		expect(screen.queryByText('Linear velocity')).not.toBeInTheDocument()
	})

	it('shows a failing GetLinearVelocity on the indicator and keeps the other values', async () => {
		seed(properties())
		queryStates.set('getLinearVelocity', { data: undefined, error: new Error('velocity failed') })
		renderSubject()

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /error/i })).toBeInTheDocument()
		})
		expect(screen.getByText('Latitude')).toBeInTheDocument()
		expect(screen.getByText('Heading')).toBeInTheDocument()
		expect(screen.getByText('RTK')).toBeInTheDocument()
		expect(screen.queryByText('Linear velocity')).not.toBeInTheDocument()
	})
})
