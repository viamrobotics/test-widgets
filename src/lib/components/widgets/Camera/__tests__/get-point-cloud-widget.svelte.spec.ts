import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-point-cloud-widget.svelte'
import { cameraQueryState, resetCameraQueryState } from './__fixtures__/get-query-state.svelte'
import Host from './__fixtures__/get-widget-host.svelte'

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

vi.mock('../../pcd/pcd-widget.svelte', async () => {
	const stub = await import('./__fixtures__/get-pcd-stub.svelte')
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
})
