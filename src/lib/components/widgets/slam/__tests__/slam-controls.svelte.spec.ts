import '../../../../../app.css'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { MachineConnectionEvent } from '@viamrobotics/sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../slam-controls.svelte'

const state = vi.hoisted(
	(): {
		cloudSlam: boolean
		moveOnMap: ReturnType<typeof vi.fn>
	} => ({
		cloudSlam: false,
		moveOnMap: vi.fn(),
	})
)

const QUERY_DATA: Record<string, () => unknown> = {
	getProperties: () => ({ cloudSlam: state.cloudSlam }),
	getPosition: () => ({
		pose: { x: 1000, y: 2000, z: 0, oX: 0, oY: 0, oZ: 1, theta: 90 },
	}),
	getPointCloudMap: () => new Uint8Array(),
}

vi.mock('@viamrobotics/svelte-sdk', () => ({
	useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	createResourceClient: vi.fn(() => ({ current: undefined })),
	createResourceQuery: vi.fn((_client: unknown, method: string) => ({
		get data() {
			return QUERY_DATA[method]?.()
		},
		isLoading: false,
		isError: false,
		error: null,
		fetchStatus: 'idle',
		refetch: () => Promise.resolve({ error: null, data: undefined }),
	})),
	createResourceMutation: vi.fn((_client: unknown, method: string) => ({
		mutate: method === 'moveOnMap' ? state.moveOnMap : vi.fn(),
		error: null,
	})),
}))

vi.mock('$lib/components/slam/map2d/index.svelte', () => ({
	default: () => {},
}))

const renderAtWidth = (width: number) => {
	const target = document.createElement('div')
	target.style.width = `${width}px`
	document.body.append(target)
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-slam' }, target })
}

describe('SlamControls', () => {
	beforeEach(() => {
		state.cloudSlam = false
		state.moveOnMap = vi.fn()
	})

	afterEach(() => {
		document.body.replaceChildren()
	})

	it('draws the map as a square at the full 320 px width', () => {
		renderAtWidth(320)

		const rect = screen.getByRole('group', { name: '2D map' }).getBoundingClientRect()

		expect(rect.width).toBe(320)
		expect(rect.height).toBe(320)
	})

	it('replaces only the map with the Cloud SLAM notice', () => {
		state.cloudSlam = true

		renderAtWidth(320)

		expect(screen.getByText(/This resource is using Cloud SLAM/u)).toBeInTheDocument()
		expect(screen.queryByRole('group', { name: '2D map' })).not.toBeInTheDocument()
		expect(screen.getByRole('region', { name: 'Motion' })).toBeInTheDocument()
	})

	it('moves to a typed destination in millimeters under Cloud SLAM', async () => {
		state.cloudSlam = true
		const user = userEvent.setup()
		renderAtWidth(320)

		await user.type(screen.getByRole('spinbutton', { name: 'X' }), '1')
		await user.type(screen.getByRole('spinbutton', { name: 'Y' }), '2')
		await user.click(screen.getByRole('button', { name: 'Execute' }))

		expect(state.moveOnMap).toHaveBeenCalledExactlyOnceWith([
			expect.objectContaining({ x: 1000, y: 2000, z: 0 }),
			'',
			'',
		])
	})

	it('passes the typed base name to the move call', async () => {
		state.cloudSlam = true
		const user = userEvent.setup()
		renderAtWidth(320)

		await user.type(screen.getByRole('textbox', { name: 'Base name' }), 'my-base')
		await user.type(screen.getByRole('spinbutton', { name: 'X' }), '1')
		await user.type(screen.getByRole('spinbutton', { name: 'Y' }), '2')
		await user.click(screen.getByRole('button', { name: 'Execute' }))

		expect(state.moveOnMap).toHaveBeenCalledExactlyOnceWith([
			expect.objectContaining({ x: 1000, y: 2000 }),
			'my-base',
			'',
		])
	})
})
