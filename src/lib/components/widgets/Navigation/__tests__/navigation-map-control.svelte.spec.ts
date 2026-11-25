import '../../../../../app.css'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { MachineConnectionEvent, navigationApi } from '@viamrobotics/sdk'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../navigation-map-control.svelte'

const state = vi.hoisted(
	(): {
		data: Record<string, unknown>
		removeWayPoint: ReturnType<typeof vi.fn>
	} => ({
		data: {},
		removeWayPoint: vi.fn(),
	})
)

const mutateAsyncFor = (method: string) => {
	if (method === 'removeWayPoint') return state.removeWayPoint
	return vi.fn(() => Promise.resolve())
}

vi.mock('@viamrobotics/svelte-sdk', () => ({
	useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	createResourceClient: vi.fn(() => ({ current: undefined })),
	createResourceQuery: vi.fn((_client: unknown, method: string) => ({
		get data() {
			return state.data[method]
		},
		isLoading: false,
		isError: false,
		error: null,
		fetchStatus: 'idle',
		refetch: () => Promise.resolve({ error: null, data: undefined }),
	})),
	createResourceMutation: vi.fn((_client: unknown, method: string) => ({
		mutateAsync: mutateAsyncFor(method),
		error: null,
	})),
}))

vi.mock('@viamrobotics/prime-map', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/prime-map')>()),
	MapLibre: () => {},
}))

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-nav' } })

describe('Navigation Map control', () => {
	beforeEach(() => {
		state.data = {}
		state.removeWayPoint.mockResolvedValue(undefined)
	})

	it('heads the section Map', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Map' })).toBeInTheDocument()
	})

	it('draws no Mode switch, which is its own control', () => {
		renderSubject()

		expect(screen.queryAllByRole('radio')).toEqual([])
	})

	it('lists the waypoints under a Waypoints heading', () => {
		state.data.getWayPoints = [
			{ id: 'first', location: { latitude: 40.7129, longitude: -74.0062 } },
			{ id: 'second', location: { latitude: 40.7133, longitude: -74.0055 } },
		]

		renderSubject()

		expect(screen.getByRole('heading', { name: 'Waypoints' })).toBeInTheDocument()
		const rows = within(screen.getByRole('list', { name: 'Waypoints' })).getAllByRole('listitem')
		expect(rows.map((row) => row.textContent.replaceAll(/\s+/g, ' ').trim())).toEqual([
			'Waypoint 1 40.7129, -74.0062',
			'Waypoint 2 40.7133, -74.0055',
		])
	})

	it('tells the user a map click adds a waypoint', () => {
		renderSubject()

		expect(screen.getByText('Click on the map to add a waypoint.')).toBeInTheDocument()
	})

	it('queries GetProperties and GetPaths', () => {
		renderSubject()

		const methods = vi.mocked(createResourceQuery).mock.calls.map(([, method]) => method)
		expect(methods).toContain('getProperties')
		expect(methods).toContain('getPaths')
	})

	describe('with a map type of None', () => {
		beforeEach(() => {
			state.data.getProperties = { mapType: navigationApi.MapType.NONE }
			state.data.getWayPoints = [
				{ id: 'first', location: { latitude: 40.7129, longitude: -74.0062 } },
			]
		})

		it('takes the notice in the 4:3 map space, keeping the waypoint list', () => {
			renderSubject()

			expect(screen.getByText('Map type is None, so there is no map.')).toBeInTheDocument()
			expect(
				within(screen.getByRole('list', { name: 'Waypoints' })).getAllByRole('listitem')
			).toHaveLength(1)
		})

		it('disables Focus and hides the click-to-add hint', () => {
			renderSubject()

			expect(screen.getByRole('button', { name: 'Focus waypoint 1' })).toBeDisabled()
			expect(screen.queryByText('Click on the map to add a waypoint.')).not.toBeInTheDocument()
		})
	})

	it('keeps Focus live and shows the hint with a GPS map', () => {
		state.data.getProperties = { mapType: navigationApi.MapType.GPS }
		state.data.getWayPoints = [{ id: 'first', location: { latitude: 1, longitude: 2 } }]

		renderSubject()

		expect(screen.queryByText('Map type is None, so there is no map.')).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Focus waypoint 1' })).toBeEnabled()
		expect(screen.getByText('Click on the map to add a waypoint.')).toBeInTheDocument()
	})

	it("disables only the pending waypoint's Remove", async () => {
		state.data.getWayPoints = [
			{ id: 'first', location: { latitude: 1, longitude: 2 } },
			{ id: 'second', location: { latitude: 3, longitude: 4 } },
		]
		let finish: () => void = () => {}
		state.removeWayPoint.mockReturnValue(
			new Promise<void>((resolve) => {
				finish = resolve
			})
		)
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Remove waypoint 1' }))

		await vi.waitFor(() => {
			expect(screen.getByRole('button', { name: 'Remove waypoint 1' })).toHaveAttribute(
				'aria-disabled',
				'true'
			)
		})
		expect(screen.getByRole('button', { name: 'Remove waypoint 1' })).toHaveAttribute(
			'aria-busy',
			'true'
		)
		expect(screen.getByRole('button', { name: 'Remove waypoint 2' })).toBeEnabled()
		expect(state.removeWayPoint).toHaveBeenCalledWith(['first'])

		finish()
		await vi.waitFor(() => {
			expect(screen.getByRole('button', { name: 'Remove waypoint 1' })).toBeEnabled()
		})
	})

	it('renders no tabs', () => {
		renderSubject()

		expect(screen.queryAllByRole('tab')).toEqual([])
	})
})
