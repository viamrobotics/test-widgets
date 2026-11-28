import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetPointCloudWidget.svelte'
import { cameraQueryState, resetCameraQueryState } from './__fixtures__/get-query-state.svelte'
import Host from './__fixtures__/GetWidgetHost.svelte'

vi.mock('@viamrobotics/sdk', () => ({ CameraClient: class {} }))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { cameraQueryState: state } = await import('./__fixtures__/get-query-state.svelte')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn(() => ({
			get data() {
				return state.pointCloudData
			},
			isLoading: false,
			isError: false,
			error: null,
			refetch: () => {
				state.fetched.push('getPointCloud')
				state.pointCloudData = state.pointCloudResponse
				return Promise.resolve({ data: state.pointCloudResponse, error: null })
			},
		})),
	}
})

vi.mock('../../PCD/PCDWidget.svelte', async () => {
	const stub = await import('./__fixtures__/GetPCDStub.svelte')
	return { default: stub.default }
})

describe('Camera GetPointCloud widget', () => {
	beforeEach(() => {
		resetCameraQueryState()
	})

	it('fetches nothing until Get point cloud is pressed', () => {
		cameraQueryState.pointCloudResponse = new Uint8Array([1, 2, 3])

		render(Host, { props: { widget: Subject } })

		expect(screen.getByRole('heading', { name: 'GetPointCloud' })).toBeInTheDocument()
		expect(cameraQueryState.fetched).toEqual([])
		expect(screen.queryByTestId('pcd')).not.toBeInTheDocument()
	})

	it('shows the point cloud labeled with the camera after the button is pressed', async () => {
		cameraQueryState.pointCloudResponse = new Uint8Array([1, 2, 3])
		render(Host, { props: { widget: Subject } })

		await userEvent.click(screen.getByRole('button', { name: 'Get point cloud' }))

		expect(cameraQueryState.fetched).toEqual(['getPointCloud'])
		const pcd = await screen.findByTestId('pcd')
		expect(pcd).toHaveAttribute('data-label', 'test-camera')
		expect(pcd).toHaveAttribute('data-bytes', '3')
	})

	it('passes the PCD widget an Add to dataset action for getPointCloud and the camera', async () => {
		cameraQueryState.pointCloudResponse = new Uint8Array([1, 2, 3])
		render(Host, { props: { widget: Subject } })

		await userEvent.click(screen.getByRole('button', { name: 'Get point cloud' }))

		const pcd = await screen.findByTestId('pcd')
		expect(pcd).toHaveAttribute('data-dataset-method', 'getPointCloud')
		expect(pcd).toHaveAttribute('data-dataset-resource', 'test-camera')
	})
})
