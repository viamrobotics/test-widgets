import '../../../../../app.css'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { MachineConnectionEvent, navigationApi } from '@viamrobotics/sdk'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../navigation-controls.svelte'

const MODE_MANUAL = 1
const MODE_WAYPOINT = 2

const state = vi.hoisted(
	(): {
		data: Record<string, unknown>
		setMode: ReturnType<typeof vi.fn>
		removeWayPoint: ReturnType<typeof vi.fn>
	} => ({
		data: {},
		setMode: vi.fn(),
		removeWayPoint: vi.fn(),
	})
)

const mutateAsyncFor = (method: string) => {
	if (method === 'setMode') return state.setMode
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

vi.mock('$lib/components/maplibre', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/components/maplibre')>()),
	MapLibre: () => {},
}))

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-nav' } })

describe('NavigationServiceControls', () => {
	beforeEach(() => {
		state.data = {}
		state.setMode.mockResolvedValue(undefined)
		state.removeWayPoint.mockResolvedValue(undefined)
	})

	it('offers Manual and Waypoint as the only modes', () => {
		renderSubject()

		const labels = screen.getAllByRole('radio').map((radio) => radio.textContent.trim())

		expect(labels).toEqual(['Manual', 'Waypoint'])
	})

	it.each([
		{ label: 'Manual', mode: MODE_MANUAL },
		{ label: 'Waypoint', mode: MODE_WAYPOINT },
	])('sets the mode to $mode when $label is pressed', async ({ label, mode }) => {
		renderSubject()

		await userEvent.click(screen.getByRole('radio', { name: label }))

		expect(state.setMode).toHaveBeenCalledWith([mode])
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

		it('takes the notice in the 4:3 map space, keeping Mode and the waypoint list', () => {
			renderSubject()

			expect(screen.getByText('Map type is None, so there is no map.')).toBeInTheDocument()
			expect(screen.getAllByRole('radio')).toHaveLength(2)
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

	it('disables Mode while SetMode is pending and drops a press made meanwhile', async () => {
		let finish: () => void = () => {}
		state.setMode.mockReturnValue(
			new Promise<void>((resolve) => {
				finish = resolve
			})
		)
		renderSubject()

		await userEvent.click(screen.getByRole('radio', { name: 'Waypoint' }))

		await vi.waitFor(() => {
			expect(screen.getByRole('radio', { name: 'Manual' })).toBeDisabled()
		})
		expect(screen.getByRole('radio', { name: 'Waypoint' }).closest('[aria-busy]')).toHaveAttribute(
			'aria-busy',
			'true'
		)
		await userEvent.click(screen.getByRole('radio', { name: 'Manual' }))
		expect(state.setMode).toHaveBeenCalledTimes(1)

		finish()
		await vi.waitFor(() => {
			expect(screen.getByRole('radio', { name: 'Manual' })).toBeEnabled()
		})
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
