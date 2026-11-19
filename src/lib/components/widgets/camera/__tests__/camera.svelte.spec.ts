import { render, screen } from '@testing-library/svelte'
import { createStreamClient } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../camera.svelte'
import { cameraQueryState, resetCameraQueryState } from './__fixtures__/get-query-state.svelte'
import Host from './__fixtures__/get-widget-host.svelte'
import Pane from './__fixtures__/in-320-pane.svelte'

const getStream = vi.fn()

vi.mock('@viamrobotics/sdk', () => ({ CameraClient: class {}, StreamClient: vi.fn() }))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { cameraQueryState: state } = await import('./__fixtures__/get-query-state.svelte')
	const dataFor = (method: string) => {
		if (method === 'getProperties') return state.properties
		if (method === 'getPointCloud') return state.pointCloudData
		return state.imagesData
	}
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createStreamClient: vi.fn(() => ({ current: { getStream: getStream } })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			get data() {
				return dataFor(method)
			},
			isLoading: false,
			isError: false,
			error: null,
			refetch: () => Promise.resolve({ data: undefined, error: null }),
		})),
	}
})

vi.mock('../../pcd/pcd-widget.svelte', async () => {
	const stub = await import('./__fixtures__/get-pcd-stub.svelte')
	return { default: stub.default }
})

const headingNames = () =>
	screen.getAllByRole('heading').map((heading) => heading.textContent?.trim())

describe('Camera composite', () => {
	beforeEach(() => {
		resetCameraQueryState()
		getStream.mockClear()
		vi.mocked(createStreamClient).mockClear()
	})

	it('stacks GetImages, GetPointCloud, then GetProperties', () => {
		render(Host, { props: { widget: Subject } })

		const names = headingNames()
		const images = names.indexOf('GetImages')
		const pointCloud = names.indexOf('GetPointCloud')
		const properties = names.indexOf('GetProperties')
		expect(images).toBeGreaterThanOrEqual(0)
		expect(pointCloud).toBeGreaterThan(images)
		expect(properties).toBeGreaterThan(pointCloud)
	})

	it('shows GetPointCloud while GetProperties has not answered', () => {
		render(Host, { props: { widget: Subject } })

		expect(screen.getByRole('heading', { name: 'GetPointCloud' })).toBeInTheDocument()
	})

	it('shows GetPointCloud when supports_pcd is true', () => {
		cameraQueryState.properties = { supportsPcd: true, mimeTypes: [] }

		render(Host, { props: { widget: Subject } })

		expect(screen.getByRole('heading', { name: 'GetPointCloud' })).toBeInTheDocument()
	})

	it('hides GetPointCloud only on an answered supports_pcd of false', () => {
		cameraQueryState.properties = { supportsPcd: false, mimeTypes: [] }

		render(Host, { props: { widget: Subject } })

		expect(screen.queryByRole('heading', { name: 'GetPointCloud' })).not.toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'GetImages' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'GetProperties' })).toBeInTheDocument()
	})

	it('streams nothing', () => {
		cameraQueryState.properties = { supportsPcd: true, mimeTypes: [] }

		render(Host, { props: { widget: Subject } })

		expect(createStreamClient).not.toHaveBeenCalled()
		expect(getStream).not.toHaveBeenCalled()
	})

	it('keeps the root and the pane within 320 px', () => {
		cameraQueryState.properties = { supportsPcd: true, mimeTypes: ['image/jpeg'] }

		const { container } = render(Pane, { props: { widget: Subject } })

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? container
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
