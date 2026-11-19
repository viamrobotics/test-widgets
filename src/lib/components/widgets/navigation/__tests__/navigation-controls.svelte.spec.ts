import '../../../../../app.css'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { MachineConnectionEvent } from '@viamrobotics/sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../navigation-controls.svelte'

const MODE_MANUAL = 1
const MODE_WAYPOINT = 2

const state = vi.hoisted(
	(): {
		data: Record<string, unknown>
		setMode: ReturnType<typeof vi.fn>
	} => ({
		data: {},
		setMode: vi.fn(),
	})
)

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
		mutateAsync: method === 'setMode' ? state.setMode : vi.fn(() => Promise.resolve()),
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

	it('renders no tabs', () => {
		renderSubject()

		expect(screen.queryAllByRole('tab')).toEqual([])
	})
})
