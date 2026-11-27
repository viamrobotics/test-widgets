import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetObjectPointCloudsWidget.svelte'
import {
	objectWithBoxAndSphere,
	objectWithMissingValues,
} from './__fixtures__/object-point-clouds.ts'

const state = vi.hoisted(
	(): {
		data: Record<string, unknown>
		cameras: string[]
		isFetching: boolean
		refetchError: Error | null
		refetch: () => void
	} => ({
		data: {},
		cameras: [],
		isFetching: false,
		refetchError: null,
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
			get isFetching() {
				return state.isFetching
			},
			fetchStatus: 'idle',
			error: null,
			refetch: () => {
				state.refetch()
				return Promise.resolve({ error: state.refetchError })
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
		state.isFetching = false
		state.refetchError = null
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

	it('lists each object with its point count and its geometry folders', () => {
		state.data.getObjectPointClouds = [objectWithBoxAndSphere, objectWithMissingValues]

		render(Subject, { props: PROPS })

		const [first, second] = within(screen.getByRole('list', { name: 'Objects' })).getAllByRole(
			'listitem'
		)
		if (!first || !second) throw new Error('expected two objects')
		expect(within(first).getByRole('group', { name: 'Object 1' }).textContent).toMatch(
			/4\s*points/u
		)
		expect(within(first).getByRole('button', { name: 'crate (box)' })).toBeInTheDocument()
		expect(within(first).getByRole('button', { name: 'ball (sphere)' })).toBeInTheDocument()
		expect(within(first).queryByRole('button', { name: 'bare (box)' })).not.toBeInTheDocument()
		expect(within(second).getByRole('group', { name: 'Object 2' }).textContent).toMatch(
			/3\s*points/u
		)
		expect(within(second).getByRole('button', { name: 'bare (box)' })).toBeInTheDocument()
	})

	it('draws no scene until an object is previewed', () => {
		state.data.getObjectPointClouds = [objectWithBoxAndSphere, objectWithMissingValues]

		const { baseElement } = render(Subject, { props: PROPS })

		expect(screen.getByRole('button', { name: 'Preview Object 1' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Preview Object 2' })).toBeInTheDocument()
		expect(baseElement.querySelector('canvas')).toBeNull()
	})

	it('opens one object in a dialog scene from Preview, and removes the scene on Close', async () => {
		state.data.getObjectPointClouds = [objectWithBoxAndSphere, objectWithMissingValues]
		const { baseElement } = render(Subject, { props: PROPS })

		await userEvent.click(screen.getByRole('button', { name: 'Preview Object 2' }))

		const dialog = await screen.findByRole('dialog', { name: 'Object 2' })
		await vi.waitFor(() => expect(dialog.querySelector('canvas')).not.toBeNull())

		await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }))

		await vi.waitFor(() => expect(baseElement.querySelector('canvas')).toBeNull())
	})

	it('holds Get object point clouds back while a fetch is in flight', async () => {
		state.isFetching = true
		render(Subject, { props: PROPS })
		const button = screen.getByRole('button', { name: 'Get object point clouds' })

		await userEvent.click(button)

		expect(button).toHaveAttribute('aria-disabled', 'true')
		expect(button).not.toHaveAttribute('aria-busy')
		expect(button).toHaveAccessibleDescription(
			'Wait for the object point clouds in flight to finish.'
		)
		expect(state.refetch).not.toHaveBeenCalled()
		expect(screen.getByTestId('status-line')).toHaveTextContent('Getting object point clouds.')
	})

	it('says a failed fetch failed', async () => {
		state.refetchError = new Error('no camera')
		render(Subject, { props: PROPS })

		await userEvent.click(screen.getByRole('button', { name: 'Get object point clouds' }))

		await vi.waitFor(() =>
			expect(screen.getByTestId('status-line')).toHaveTextContent('Get object point clouds failed')
		)
	})
})
