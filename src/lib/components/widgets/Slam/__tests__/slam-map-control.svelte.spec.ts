import '../../../../../app.css'

import { render, screen, within } from '@testing-library/svelte'
import { MachineConnectionEvent } from '@viamrobotics/sdk'
import { Vector3 } from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import MoveOnMapControl from '../move-on-map-control.svelte'
import Subject from '../slam-map-control.svelte'

const state = vi.hoisted(
	(): {
		cloudSlam: boolean
		legendOpen: boolean | undefined
		onClick: ((value: Vector3) => void) | undefined
	} => ({
		cloudSlam: false,
		legendOpen: undefined,
		onClick: undefined,
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
	createResourceMutation: vi.fn(() => ({
		mutate: vi.fn(),
		mutateAsync: vi.fn(() => Promise.resolve()),
		error: null,
	})),
}))

vi.mock('$lib/components/slam/map2d/index.svelte', () => ({
	default: (
		_anchor: unknown,
		props: { legendOpen?: boolean; onClick: (value: Vector3) => void }
	) => {
		state.legendOpen = props.legendOpen
		state.onClick = props.onClick
	},
}))

const PROPS = { partID: 'test-part', resourceName: 'test-slam' }

const renderAtWidth = (width: number, component = [Subject]) => {
	const target = document.createElement('div')
	target.style.width = `${width}px`
	document.body.append(target)
	render(InWidgetsProvider, { props: { component, props: PROPS }, target })
}

const endPositionField = (axis: 'X' | 'Y') =>
	within(screen.getByRole('group', { name: 'End position' })).getByRole('spinbutton', {
		name: axis,
	})

const clickMapAt = (x: number, y: number) => {
	if (!state.onClick) throw new Error('The 2D map was not drawn')
	state.onClick(new Vector3(x, y, 0))
}

describe('Slam Map control', () => {
	beforeEach(() => {
		state.cloudSlam = false
		state.legendOpen = undefined
		state.onClick = undefined
	})

	afterEach(() => {
		document.body.replaceChildren()
	})

	it('heads the section Map', () => {
		renderAtWidth(320)

		expect(screen.getByRole('heading', { name: 'Map' })).toBeInTheDocument()
	})

	it('draws the map as a square at the full 320 px width', () => {
		renderAtWidth(320)

		const rect = screen.getByRole('group', { name: '2D map' }).getBoundingClientRect()

		expect(rect.width).toBe(320)
		expect(rect.height).toBe(320)
	})

	it('replaces the map with the Cloud SLAM notice and its Learn more link', () => {
		state.cloudSlam = true

		renderAtWidth(320)

		expect(screen.getByText(/This resource is using Cloud SLAM/u)).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'Learn more' })).toBeInTheDocument()
		expect(screen.queryByRole('group', { name: '2D map' })).not.toBeInTheDocument()
	})

	it('starts the map legend collapsed at 672 px', async () => {
		renderAtWidth(672)

		await vi.waitFor(() => {
			expect(state.legendOpen).toBe(false)
		})
	})

	it('starts the map legend open below 672 px', async () => {
		renderAtWidth(671)

		await vi.waitFor(() => {
			expect(state.legendOpen).toBe(true)
		})
	})

	it("fills MoveOnMap's end position from a map click, rounded to five digits", async () => {
		renderAtWidth(320, [Subject, MoveOnMapControl])
		await vi.waitFor(() => {
			expect(state.onClick).toBeTypeOf('function')
		})

		clickMapAt(1.234_567, -2.5)

		await vi.waitFor(() => {
			expect(endPositionField('X')).toHaveValue(1.234_57)
		})
		expect(endPositionField('Y')).toHaveValue(-2.5)
	})
})
