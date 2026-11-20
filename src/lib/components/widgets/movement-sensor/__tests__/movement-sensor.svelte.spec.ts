import '../../../../../app.css'

import { fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../movement-sensor.svelte'
import InPane from './__fixtures__/in-320-pane.svelte'

interface QueryState {
	data: unknown
	error: Error | null
}

const { queryStates, refetches, queryOptions } = vi.hoisted(() => ({
	queryStates: new Map<string, QueryState>(),
	refetches: new Map<string, ReturnType<typeof vi.fn>>(),
	queryOptions: new Map<string, unknown>(),
}))

const refetchFor = (method: string) => {
	const existing = refetches.get(method)
	if (existing !== undefined) return existing
	const created = vi.fn()
	refetches.set(method, created)
	return created
}

vi.mock('../map.svelte', () => ({ default: () => {} }))

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
				refetch: refetchFor(method),
			}
		}),
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
		refetches.clear()
		queryOptions.clear()
		localStorage.clear()
	})

	it('reads getProperties once', () => {
		renderSubject()

		expect(queryOptions.get('getProperties')).toEqual({ refetchInterval: false })
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
		await fireEvent.focusIn(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

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

		expect(screen.getByText('Latitude')).toBeInTheDocument()
	})

	it("shows a failing position query on the position section's indicator", async () => {
		queryStates.set('getProperties', { data: POSITION_SUPPORTED, error: null })
		queryStates.set('getPosition', { data: undefined, error: new Error('position unavailable') })

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetPosition: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/position unavailable/iu)).toBeInTheDocument()
	})

	it("shows a failing accuracy query on the accuracy section's indicator", async () => {
		queryStates.set('getProperties', { data: POSITION_SUPPORTED, error: null })
		queryStates.set('getAccuracy', { data: undefined, error: new Error('accuracy unavailable') })

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetAccuracy: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/accuracy unavailable/iu)).toBeInTheDocument()
	})
})

describe('MovementSensor composite layout', () => {
	const ALL_SUPPORTED = {
		positionSupported: true,
		orientationSupported: true,
		compassHeadingSupported: true,
		angularVelocitySupported: true,
		linearVelocitySupported: true,
		linearAccelerationSupported: true,
	}

	const heading = (name: string) => screen.getByRole('heading', { name })

	const isBefore = (first: Element, second: Element) =>
		(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

	const renderAtWidth = (width: number) => {
		const target = document.createElement('div')
		target.style.width = `${width}px`
		document.body.append(target)
		render(Subject, {
			props: { partID: 'test-part', resourceName: 'test-movement-sensor' },
			target,
		})
	}

	beforeEach(() => {
		queryStates.clear()
		localStorage.clear()
		queryStates.set('getProperties', { data: ALL_SUPPORTED, error: null })
	})

	afterEach(() => {
		document.body.replaceChildren()
	})

	it('draws the refresh row first, then the queries in the board order', () => {
		renderAtWidth(672)

		const order = [
			screen.getByRole('group', { name: 'Refresh' }),
			...[
				'GetPosition',
				'GetOrientation',
				'GetCompassHeading',
				'GetAngularVelocity',
				'GetLinearVelocity',
				'GetLinearAcceleration',
				'GetAccuracy',
				'GetReadings',
				'GetProperties',
			].map((name) => heading(name)),
		]
		for (const [index, element] of order.entries()) {
			const next = order[index + 1]
			if (next !== undefined) expect(isBefore(element, next)).toBe(true)
		}
	})

	it('refetches every polled query from the manual refresh, and not the static properties', async () => {
		renderAtWidth(672)

		await fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
		await fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

		const refetched = [...refetches.entries()]
			.filter(([, refetch]) => refetch.mock.calls.length > 0)
			.map(([method]) => method)
		expect(refetched.toSorted()).toEqual(
			[
				'getAccuracy',
				'getAngularVelocity',
				'getCompassHeading',
				'getLinearAcceleration',
				'getLinearVelocity',
				'getOrientation',
				'getPosition',
			].toSorted()
		)

		await fireEvent.click(screen.getByRole('checkbox', { name: 'Show readings' }))
		await fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

		expect(refetchFor('getReadings')).toHaveBeenCalledTimes(1)
	})

	it('stacks the sections below 672 px', () => {
		renderAtWidth(671)

		const position = heading('GetPosition').getBoundingClientRect()
		const orientation = heading('GetOrientation').getBoundingClientRect()
		expect(orientation.top).toBeGreaterThan(position.bottom)
	})

	it('puts two sections side by side from 672 px', () => {
		renderAtWidth(672)

		const position = heading('GetPosition').getBoundingClientRect()
		const orientation = heading('GetOrientation').getBoundingClientRect()
		expect(orientation.top).toBe(position.top)
		expect(orientation.left).toBeGreaterThan(position.right)
	})

	it('reads GetReadings only after Show readings is checked, and copies it as JSON', async () => {
		queryStates.set('getReadings', { data: { speed: 2 }, error: null })
		renderAtWidth(672)

		expect(screen.queryByText('speed')).not.toBeInTheDocument()
		await fireEvent.click(screen.getByRole('checkbox', { name: 'Show readings' }))

		expect(screen.getByText('speed')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument()
	})

	it('hides Copy JSON when readings are hidden again, though the query keeps its data', async () => {
		queryStates.set('getReadings', { data: { speed: 2 }, error: null })
		renderAtWidth(672)
		await fireEvent.click(screen.getByRole('checkbox', { name: 'Show readings' }))
		expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument()

		await fireEvent.click(screen.getByRole('checkbox', { name: 'Show readings' }))

		expect(screen.queryByRole('button', { name: 'Copy JSON' })).not.toBeInTheDocument()
	})
})

describe('MovementSensor composite GetProperties section', () => {
	beforeEach(() => {
		queryStates.clear()
		localStorage.clear()
	})

	it('draws the supported and unsupported methods from the properties', () => {
		queryStates.set('getProperties', { data: POSITION_SUPPORTED, error: null })

		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetProperties' })).toBeInTheDocument()
		expect(screen.getByRole('img', { name: 'Position' })).toBeInTheDocument()
		expect(screen.getByRole('img', { name: 'Orientation' })).toBeInTheDocument()
	})

	it('draws GetReadings while GetProperties has no data', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetReadings' })).toBeInTheDocument()
	})

	it('draws GetReadings while GetProperties errors', () => {
		queryStates.set('getProperties', {
			data: undefined,
			error: new Error('properties unavailable'),
		})

		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetReadings' })).toBeInTheDocument()
		expect(screen.queryByRole('heading', { name: 'GetProperties' })).not.toBeInTheDocument()
	})

	it('draws no GetProperties section until the properties arrive', () => {
		renderSubject()

		expect(screen.queryByRole('heading', { name: 'GetProperties' })).not.toBeInTheDocument()
	})
})

describe('MovementSensor widget in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		queryStates.clear()
		queryStates.set('getProperties', { data: POSITION_SUPPORTED, error: null })
		render(InPane, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
