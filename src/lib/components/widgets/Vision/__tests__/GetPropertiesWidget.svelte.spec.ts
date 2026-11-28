import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetPropertiesWidget.svelte'

const state = vi.hoisted((): { data: Record<string, unknown> } => ({ data: {} }))

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
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const PROPS = { partID: 'test-part', resourceName: 'test-vision' }

const row = (name: string) => screen.getByRole('group', { name })

describe('<VisionServiceGetPropertiesWidget>', () => {
	beforeEach(() => {
		state.data = {}
	})

	it('reads GetProperties once, with no polling', () => {
		render(Subject, { props: PROPS })

		const call = vi
			.mocked(createResourceQuery)
			.mock.calls.findLast(([, method]) => String(method) === 'getProperties')
		expect(call, 'GetProperties was never queried').toBeDefined()
		expect(call?.[2]).toBeUndefined()
	})

	it('reads a supported capability as Supported with a success dot', () => {
		state.data.getProperties = {
			classificationsSupported: true,
			detectionsSupported: true,
			objectPointCloudsSupported: true,
			detections3dSupported: true,
			defaultCamera: 'camera-1',
		}

		render(Subject, { props: PROPS })

		expect(row('3D detections')).toHaveTextContent('Supported')
		expect(row('Classifications')).toHaveTextContent('Supported')
		expect(row('Detections')).toHaveTextContent('Supported')
		expect(row('Object point clouds')).toHaveTextContent('Supported')
		expect(screen.getAllByRole('img', { name: 'Supported' })).toHaveLength(4)
	})

	it('reads an unsupported capability as Not supported with a disabled dot', () => {
		state.data.getProperties = {
			classificationsSupported: false,
			detectionsSupported: true,
			objectPointCloudsSupported: false,
			defaultCamera: 'camera-1',
		}

		render(Subject, { props: PROPS })

		expect(row('Classifications')).toHaveTextContent('Not supported')
		expect(row('Detections').textContent.trim()).toBe('Supported')
		expect(row('Object point clouds')).toHaveTextContent('Not supported')
		expect(screen.getAllByRole('img', { name: 'Not supported' })).toHaveLength(2)
	})

	it('reads the default camera by name', () => {
		state.data.getProperties = {
			classificationsSupported: true,
			detectionsSupported: true,
			objectPointCloudsSupported: true,
			defaultCamera: 'camera-1',
		}

		render(Subject, { props: PROPS })

		expect(row('Default camera')).toHaveTextContent('camera-1')
	})

	it('reads an empty default camera as -', () => {
		state.data.getProperties = {
			classificationsSupported: true,
			detectionsSupported: true,
			objectPointCloudsSupported: true,
			defaultCamera: '',
		}

		render(Subject, { props: PROPS })

		expect(row('Default camera').textContent.trim()).toBe('-')
	})

	it.each(['Classifications', 'Detections', 'Object point clouds', 'Default camera'])(
		'reads %s as - before GetProperties answers',
		(name) => {
			render(Subject, { props: PROPS })

			expect(row(name).textContent.trim()).toBe('-')
		}
	)
})
