import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../movement-sensor.svelte'

interface QueryState {
	data: unknown
	error: Error | null
}

const { queryStates } = vi.hoisted(() => ({ queryStates: new Map<string, QueryState>() }))

vi.mock('../map.svelte', () => ({ default: () => {} }))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
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
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const POSITION_SUPPORTED = {
	positionSupported: true,
	orientationSupported: false,
	compassHeadingSupported: false,
	angularVelocitySupported: false,
	linearVelocitySupported: false,
	linearAccelerationSupported: false,
}

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-movement-sensor' },
	})

describe('MovementSensor widget', () => {
	beforeEach(() => {
		queryStates.clear()
		localStorage.clear()
	})

	it('shows no sensor sections until properties arrive', () => {
		renderSubject()

		expect(screen.queryByRole('heading', { name: 'GetAccuracy' })).not.toBeInTheDocument()
	})

	it('shows a failing properties query on the indicator', async () => {
		queryStates.set('getProperties', {
			data: undefined,
			error: new Error('properties unavailable'),
		})

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/properties unavailable/iu)).toBeInTheDocument()
	})

	it('renders only the supported sections once properties arrive', () => {
		queryStates.set('getProperties', { data: POSITION_SUPPORTED, error: null })

		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetPosition' })).toBeInTheDocument()
		expect(screen.queryByRole('heading', { name: /GetOrientation/u })).not.toBeInTheDocument()
	})

	it('renders the position content once its data arrives', () => {
		queryStates.set('getProperties', { data: POSITION_SUPPORTED, error: null })
		queryStates.set('getPosition', {
			data: { coordinate: { latitude: 12.5, longitude: 3 }, altitudeM: 7 },
			error: null,
		})

		renderSubject()

		expect(screen.getByText('Lat')).toBeInTheDocument()
	})

	it("shows a failing position query on the position section's indicator", async () => {
		queryStates.set('getProperties', { data: POSITION_SUPPORTED, error: null })
		queryStates.set('getPosition', { data: undefined, error: new Error('position unavailable') })

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/position unavailable/iu)).toBeInTheDocument()
	})

	it("shows a failing accuracy query on the accuracy section's indicator", async () => {
		queryStates.set('getProperties', { data: POSITION_SUPPORTED, error: null })
		queryStates.set('getAccuracy', { data: undefined, error: new Error('accuracy unavailable') })

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/accuracy unavailable/iu)).toBeInTheDocument()
	})
})
