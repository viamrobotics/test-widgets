import '../../../../../app.css'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { MachineConnectionEvent, motionApi } from '@viamrobotics/sdk'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { Vector3 } from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import MoveOnMapControl from '../MoveOnMapControl.svelte'
import Subject from '../SlamMapControl.svelte'

const state = vi.hoisted(
	(): {
		cloudSlam: boolean
		legendOpen: boolean | undefined
		onClick: ((value: Vector3) => void) | undefined
		basePose: { x: number; y: number; theta: number } | undefined
		motionPath: Float32Array | undefined
		planState: number | undefined
		hasPosition: boolean
	} => ({
		cloudSlam: false,
		legendOpen: undefined,
		onClick: undefined,
		basePose: undefined,
		motionPath: undefined,
		planState: undefined,
		hasPosition: true,
	})
)

const QUERY_DATA: Record<string, () => unknown> = {
	getProperties: () => ({ cloudSlam: state.cloudSlam }),
	getPosition: () =>
		state.hasPosition
			? { pose: { x: 1000, y: 2000, z: 0, oX: 0, oY: 0, oZ: 1, theta: 90 } }
			: undefined,
	getPointCloudMap: () => new Uint8Array(),
	getPlan: () => ({
		currentPlanWithStatus: {
			status: { state: state.planState },
			plan: {
				steps: [
					{ step: { 1: { pose: { x: 1000, y: 2000 } } } },
					{ step: { 1: { pose: { x: 3000, y: 4500 } } } },
				],
			},
		},
	}),
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

vi.mock('#lib/components/Slam/map2d/index.svelte', () => ({
	default: (
		_anchor: unknown,
		props: {
			legendOpen?: boolean
			onClick: (value: Vector3) => void
			basePose?: { x: number; y: number; theta: number }
			motionPath?: Float32Array
		}
	) => {
		state.legendOpen = props.legendOpen
		state.basePose = props.basePose
		state.motionPath = props.motionPath
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

const isPlanReadEnabled = () => {
	const call = vi
		.mocked(createResourceQuery)
		.mock.calls.findLast(([, name]) => String(name) === 'getPlan')
	const options: unknown = call?.[3]
	if (typeof options !== 'function') throw new Error('No getPlan query was created')
	const { enabled }: { enabled?: unknown } = options()
	return enabled
}

const refetchIntervalOf = (method: string, optionsIndex: number) => {
	const call = vi
		.mocked(createResourceQuery)
		.mock.calls.findLast(([, name]) => String(name) === method)
	const options: unknown = call?.[optionsIndex]
	if (typeof options !== 'function') throw new Error(`No ${method} query was created`)
	const { refetchInterval }: { refetchInterval?: unknown } = options()
	return refetchInterval
}

const clickMapAt = (x: number, y: number) => {
	if (!state.onClick) throw new Error('The 2D map was not drawn')
	state.onClick(new Vector3(x, y, 0))
}

describe('Slam Map control', () => {
	beforeEach(() => {
		state.cloudSlam = false
		state.legendOpen = undefined
		state.onClick = undefined
		state.basePose = undefined
		state.motionPath = undefined
		state.planState = undefined
		state.hasPosition = true
	})

	afterEach(() => {
		window.localStorage.clear()
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

	it('reads no plan until a base is named', () => {
		renderAtWidth(320, [Subject, MoveOnMapControl])

		expect(isPlanReadEnabled()).toBe(false)
	})

	it('reads the plan of the base named in MoveOnMap', async () => {
		renderAtWidth(320, [Subject, MoveOnMapControl])

		await userEvent.type(screen.getByRole('textbox', { name: 'Base name' }), 'base-1')

		expect(isPlanReadEnabled()).toBe(true)
	})

	it('draws the base pose in meters, where the method returns millimeters', async () => {
		renderAtWidth(320)

		await vi.waitFor(() => {
			expect(state.basePose).toBeDefined()
		})
		expect(state.basePose).toEqual({ x: 1, y: 2, theta: 90 })
	})

	it('draws no path unless the plan is IN_PROGRESS', async () => {
		state.planState = motionApi.PlanState.STOPPED
		renderAtWidth(320, [Subject, MoveOnMapControl])
		await userEvent.type(screen.getByRole('textbox', { name: 'Base name' }), 'base-1')

		await vi.waitFor(() => {
			expect(state.basePose).toBeDefined()
		})
		expect(state.motionPath).toBeUndefined()
	})

	it('draws the IN_PROGRESS plan path in meters', async () => {
		state.planState = motionApi.PlanState.IN_PROGRESS
		renderAtWidth(320, [Subject, MoveOnMapControl])
		await userEvent.type(screen.getByRole('textbox', { name: 'Base name' }), 'base-1')

		await vi.waitFor(() => {
			expect(state.motionPath).toBeDefined()
		})
		expect([...(state.motionPath ?? [])]).toEqual([1, 2, 3, 4.5])
	})

	it('shows Loading map until the position and point cloud are read', () => {
		state.hasPosition = false
		renderAtWidth(320)

		expect(screen.getByRole('progressbar', { name: 'Loading map' })).toBeInTheDocument()
		expect(state.basePose).toBeUndefined()
	})

	it('stops polling after Pause', async () => {
		renderAtWidth(320)

		expect(refetchIntervalOf('getPosition', 2)).not.toBe(false)

		await userEvent.click(screen.getByRole('button', { name: 'Pause' }))

		await vi.waitFor(() => {
			expect(refetchIntervalOf('getPosition', 2)).toBe(false)
		})
		expect(refetchIntervalOf('getPointCloudMap', 2)).toBe(false)
		expect(refetchIntervalOf('getPlan', 3)).toBe(false)
	})
})
