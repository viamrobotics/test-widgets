import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-object-point-clouds-widget.svelte'
import {
	objectWithBoxAndSphere,
	objectWithMissingValues,
} from './__fixtures__/object-point-clouds.ts'

const state = vi.hoisted(
	(): {
		data: Record<string, unknown>
		cameras: string[]
		refetch: () => void
	} => ({
		data: {},
		cameras: [],
		refetch: () => undefined,
	})
)

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createStreamClient: vi.fn(() => ({ mediaStream: undefined })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			get data() {
				return state.data[method]
			},
			isLoading: false,
			isSuccess: true,
			isError: false,
			isFetching: false,
			fetchStatus: 'idle',
			error: null,
			refetch: () => {
				state.refetch()
				return Promise.resolve({})
			},
		})),
		useResourceStatuses: vi.fn(() => ({
			get current() {
				return state.cameras.map((name) => ({ name: { name } }))
			},
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const PROPS = { partID: 'test-part', resourceName: 'test-vision' }

const callIfFunction = (value: unknown): unknown => (typeof value === 'function' ? value() : value)

const objectsQueryCall = () => {
	const call = vi
		.mocked(createResourceQuery)
		.mock.calls.findLast((candidate) => String(candidate[1]) === 'getObjectPointClouds')
	if (!call) throw new Error('getObjectPointClouds was never queried')
	return { args: callIfFunction(call[2]), options: callIfFunction(call[3]) }
}

describe('<VisionServiceGetObjectPointCloudsWidget>', () => {
	beforeEach(() => {
		state.data = {}
		state.cameras = ['cam-1', 'cam-2']
		state.refetch = vi.fn()
	})

	it('fetches nothing until Get object point clouds is pressed', async () => {
		render(Subject, { props: PROPS })

		expect(objectsQueryCall().options).toMatchObject({ enabled: false })
		expect(state.refetch).not.toHaveBeenCalled()

		await userEvent.click(screen.getByRole('button', { name: 'Get object point clouds' }))

		expect(state.refetch).toHaveBeenCalledTimes(1)
	})

	it('reads Objects as - with the fetch hint before a fetch', () => {
		render(Subject, { props: PROPS })

		expect(screen.getByRole('group', { name: 'Objects' })).toHaveTextContent('-')
		expect(
			screen.getByText('Press Get object point clouds to fetch. The query is large and slow.')
		).toBeInTheDocument()
	})

	it('reads Objects as - without the hint when a fetch returns none', () => {
		state.data.getObjectPointClouds = []

		render(Subject, { props: PROPS })

		expect(screen.getByRole('group', { name: 'Objects' })).toHaveTextContent('-')
		expect(screen.queryByText(/Press Get object point clouds/u)).not.toBeInTheDocument()
	})

	it('renders its own Camera row and sends the first camera by default', () => {
		render(Subject, { props: PROPS })

		expect(screen.getByRole('combobox', { name: 'Camera' })).toBeInTheDocument()
		expect(objectsQueryCall().args).toEqual(['cam-1'])
	})

	it('hides the Camera row and sends cameraName when a host sets it', () => {
		render(Subject, { props: { ...PROPS, cameraName: 'cam-2' } })

		expect(screen.queryByRole('combobox', { name: 'Camera' })).not.toBeInTheDocument()
		expect(objectsQueryCall().args).toEqual(['cam-2'])
	})

	it('sends the empty name for the default camera when a host sets it', () => {
		render(Subject, { props: { ...PROPS, cameraName: '' } })

		expect(screen.queryByRole('combobox', { name: 'Camera' })).not.toBeInTheDocument()
		expect(objectsQueryCall().args).toEqual([''])
	})

	it('renders one framed view per object, each followed by its geometry folders', () => {
		state.data.getObjectPointClouds = [objectWithBoxAndSphere, objectWithMissingValues]

		render(Subject, { props: PROPS })

		expect(screen.getAllByTestId('object-point-cloud-cell')).toHaveLength(2)
		const first = screen.getByRole('region', { name: 'Object 1' })
		expect(within(first).getByRole('group', { name: 'Object 1 point cloud' })).toBeInTheDocument()
		expect(within(first).getByRole('button', { name: 'crate (box)' })).toBeInTheDocument()
		expect(within(first).getByRole('button', { name: 'ball (sphere)' })).toBeInTheDocument()
		expect(within(first).queryByRole('button', { name: 'bare (box)' })).not.toBeInTheDocument()
		const second = screen.getByRole('region', { name: 'Object 2' })
		expect(within(second).getByRole('group', { name: 'Object 2 point cloud' })).toBeInTheDocument()
		expect(within(second).getByRole('button', { name: 'bare (box)' })).toBeInTheDocument()
	})

	it('lays the objects out in one column below @2xl and two from it', () => {
		state.data.getObjectPointClouds = [objectWithBoxAndSphere, objectWithMissingValues]

		render(Subject, { props: PROPS })

		const grid = screen.getByRole('region', { name: 'Object 1' }).parentElement
		expect(grid).toHaveClass('grid', 'grid-cols-1', '@2xl:grid-cols-2')
		expect(grid?.parentElement).toHaveClass('@container')
	})
})
