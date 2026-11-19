import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-point-cloud-map-widget.svelte'
import {
	pointCloudMapQueryState as queryState,
	resetPointCloudMapQueryState,
} from './__fixtures__/get-point-cloud-map-query-state.svelte'

vi.mock('@viamrobotics/sdk', () => ({ SlamClient: class {} }))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { pointCloudMapQueryState: state } =
		await import('./__fixtures__/get-point-cloud-map-query-state.svelte')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, _method: string, args: () => unknown[]) => ({
			get data() {
				return state.data
			},
			isLoading: false,
			isError: false,
			error: null,
			refetch: () => {
				state.fetchedWith.push(args())
				state.data = state.response
				return Promise.resolve({ data: state.response, error: null })
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

describe('SLAM GetPointCloudMap widget', () => {
	beforeEach(() => {
		resetPointCloudMapQueryState()
	})

	it('shows the checkbox and button, and no view, until fetched', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetPointCloudMap' })).toBeInTheDocument()
		expect(screen.getByRole('checkbox', { name: 'Return edited map' })).not.toBeChecked()
		expect(screen.getByRole('button', { name: 'Get point cloud map' })).toBeInTheDocument()
		expect(queryState.fetchedWith).toEqual([])
		expect(screen.queryByTestId('pcd')).not.toBeInTheDocument()
	})

	it('fetches with the unchecked value by default', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Get point cloud map' }))

		expect(queryState.fetchedWith).toEqual([[false]])
	})

	it('fetches with the checkbox value once it is checked', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('checkbox', { name: 'Return edited map' }))
		await userEvent.click(screen.getByRole('button', { name: 'Get point cloud map' }))

		expect(queryState.fetchedWith).toEqual([[true]])
	})

	it('shows the point cloud labeled with the resource after a fetch', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Get point cloud map' }))

		const pcd = await screen.findByTestId('pcd')
		expect(pcd).toHaveAttribute('data-label', 'test-slam')
		expect(pcd).toHaveAttribute('data-bytes', '3')
	})
})
