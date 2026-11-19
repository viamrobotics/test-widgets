import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../slam.svelte'
import {
	pointCloudMapQueryState,
	resetPointCloudMapQueryState,
} from './__fixtures__/get-point-cloud-map-query-state.svelte'
import Pane from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted(() => ({ cloudSlam: false }))

vi.mock('@viamrobotics/sdk', () => ({
	CameraClient: class {},
	SlamClient: class {},
	StreamClient: class {},
	slamApi: {
		MappingMode: {
			UNSPECIFIED: 0,
			CREATE_NEW_MAP: 1,
			LOCALIZE_ONLY: 2,
			UPDATE_EXISTING_MAP: 3,
		},
		SensorType: { UNSPECIFIED: 0, CAMERA: 1, MOVEMENT_SENSOR: 2 },
	},
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { pointCloudMapQueryState: pcm } =
		await import('./__fixtures__/get-point-cloud-map-query-state.svelte')
	const dataFor = (method: string) => {
		if (method === 'getProperties') {
			return { cloudSlam: state.cloudSlam, mappingMode: 2, sensorInfo: [] }
		}
		if (method === 'getPointCloudMap') return pcm.data
		return undefined
	}
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createStreamClient: vi.fn(() => ({ current: undefined })),
		createResourceQuery: vi.fn((_client: unknown, method: string, args: unknown) => ({
			get data() {
				return dataFor(method)
			},
			isLoading: false,
			isError: false,
			error: null,
			refetch: () => {
				pcm.fetchedWith.push(typeof args === 'function' ? args() : [])
				return Promise.resolve({ data: pcm.response, error: null })
			},
		})),
	}
})

vi.mock('../../pcd/pcd-widget.svelte', async () => {
	const stub = await import('../../camera/__tests__/__fixtures__/get-pcd-stub.svelte')
	return { default: stub.default }
})

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-slam' } })

const headingNames = () =>
	screen.getAllByRole('heading').map((heading) => heading.textContent?.trim())

describe('SLAM composite', () => {
	beforeEach(() => {
		state.cloudSlam = false
		resetPointCloudMapQueryState()
	})

	it('stacks GetPosition, GetPointCloudMap, then GetProperties', () => {
		renderSubject()

		const names = headingNames()
		const position = names.indexOf('GetPosition')
		const map = names.indexOf('GetPointCloudMap')
		const properties = names.indexOf('GetProperties')
		expect(position).toBeGreaterThanOrEqual(0)
		expect(map).toBeGreaterThan(position)
		expect(properties).toBeGreaterThan(map)
	})

	it('shows the Cloud SLAM notice when cloudSlam is true', () => {
		state.cloudSlam = true

		renderSubject()

		expect(screen.getByText(/This resource is using Cloud SLAM/u)).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'Learn more' })).toBeInTheDocument()
	})

	it('shows no notice when cloudSlam is false', () => {
		renderSubject()

		expect(screen.queryByText(/This resource is using Cloud SLAM/u)).not.toBeInTheDocument()
	})

	it('does not fetch the map before its button is pressed', async () => {
		renderSubject()

		expect(pointCloudMapQueryState.fetchedWith).toEqual([])

		await userEvent.click(screen.getByRole('button', { name: 'Get point cloud map' }))

		expect(pointCloudMapQueryState.fetchedWith).toHaveLength(1)
	})

	it('keeps the root and the pane within 320 px', () => {
		const { container } = render(Pane, { props: { widget: Subject } })

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? container
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
