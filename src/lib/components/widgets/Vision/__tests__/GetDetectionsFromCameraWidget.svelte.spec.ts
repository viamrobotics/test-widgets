import { render, screen, within } from '@testing-library/svelte'
import { Detection } from '@viamrobotics/sdk'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetDetectionsFromCameraWidget.svelte'

const state = vi.hoisted((): { data: Record<string, unknown>; cameras: string[] } => ({
	data: {},
	cameras: [],
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
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
			refetch: vi.fn(),
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

const getQuery = (method: string) => {
	const call = vi.mocked(createResourceQuery).mock.calls.findLast(([, name]) => name === method)
	if (call === undefined) throw new Error(`No query was created for ${method}`)
	return { args: callIfFunction(call[2]), options: callIfFunction(call[3]) }
}

describe('GetDetectionsFromCamera widget', () => {
	beforeEach(() => {
		state.data = {}
		state.cameras = []
	})

	it('polls GetDetectionsFromCamera once a second and draws the poll control', () => {
		render(Subject, { props: PROPS })

		expect(callIfFunction(getQuery('getDetectionsFromCamera').options)).toMatchObject({
			refetchInterval: 1000,
		})
		expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
		expect(screen.getByRole('combobox', { name: 'Updates' })).toBeInTheDocument()
	})

	it("sends the Camera row's camera", () => {
		state.cameras = ['cam-1']

		render(Subject, { props: PROPS })

		expect(screen.getByRole('combobox', { name: 'Camera' })).toHaveTextContent('cam-1')
		expect(getQuery('getDetectionsFromCamera').args).toEqual(['cam-1'])
	})

	it('hides the Camera row and sends the cameraName it is given', () => {
		state.cameras = ['cam-1']

		render(Subject, { props: { ...PROPS, cameraName: 'cam-2' } })

		expect(screen.queryByRole('combobox', { name: 'Camera' })).not.toBeInTheDocument()
		expect(getQuery('getDetectionsFromCamera').args).toEqual(['cam-2'])
	})

	it('draws a row for each detection in the response', () => {
		state.data.getDetectionsFromCamera = [
			new Detection({ xMin: 1n, yMin: 2n, xMax: 3n, yMax: 4n, confidence: 0.5, className: 'dog' }),
		]

		render(Subject, { props: PROPS })

		expect(
			within(screen.getByRole('list', { name: 'Detections' })).getByRole('listitem')
		).toHaveTextContent('dog 50.00 % (1, 2) to (3, 4)')
	})

	it('reads - before any detections arrive', () => {
		render(Subject, { props: PROPS })

		expect(screen.getByRole('group', { name: 'Detections' })).toHaveTextContent('Detections -')
	})
})
