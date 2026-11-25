import { render, screen, within } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-properties-widget.svelte'
import { cameraQueryState, resetCameraQueryState } from './__fixtures__/get-query-state.svelte'
import Host from './__fixtures__/get-widget-host.svelte'

vi.mock('@viamrobotics/sdk', () => ({ CameraClient: class {} }))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { cameraQueryState: state } = await import('./__fixtures__/get-query-state.svelte')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn(() => ({
			get data() {
				return state.properties
			},
			isLoading: false,
			isError: false,
			error: null,
		})),
	}
})

const group = (name: string) => within(screen.getByRole('group', { name }))

describe('Camera GetProperties widget', () => {
	beforeEach(() => {
		resetCameraQueryState()
	})

	it('renders every property of a full response', () => {
		cameraQueryState.properties = {
			supportsPcd: true,
			frameRate: 30,
			mimeTypes: ['image/jpeg', 'image/png'],
			intrinsicParameters: {
				widthPx: 1280,
				heightPx: 720,
				focalXPx: 910.5,
				focalYPx: 910.2,
				centerXPx: 640,
				centerYPx: 360,
			},
			distortionParameters: { model: 'brown_conrady', parameters: [-0.281, 0.074] },
		}

		render(Host, { props: { widget: Subject } })

		expect(screen.getByRole('heading', { name: 'GetProperties' })).toBeInTheDocument()
		expect(screen.getByRole('img', { name: 'Supports point cloud' })).toBeInTheDocument()
		expect(group('Properties').getByText('Yes')).toBeInTheDocument()
		expect(group('Properties').getByText('30')).toBeInTheDocument()
		expect(group('Properties').getByText('fps')).toBeInTheDocument()
		expect(screen.getByText('MIME types: image/jpeg, image/png')).toBeInTheDocument()
		expect(group('Intrinsics').getByText('1280')).toBeInTheDocument()
		expect(group('Intrinsics').getByText('910.5')).toBeInTheDocument()
		expect(group('Intrinsics').getAllByText('px')).toHaveLength(6)
		expect(group('Distortion model').getByText('brown_conrady')).toBeInTheDocument()
		expect(group('Distortion parameters').getByText('-0.281')).toBeInTheDocument()
		expect(group('Distortion parameters').getByText('0.074')).toBeInTheDocument()
	})

	it('reads No for a camera without point cloud support', () => {
		cameraQueryState.properties = { supportsPcd: false, mimeTypes: [] }

		render(Host, { props: { widget: Subject } })

		expect(group('Properties').getByText('No')).toBeInTheDocument()
	})

	it('reads - for every value that is missing', () => {
		render(Host, { props: { widget: Subject } })

		expect(screen.queryByRole('img', { name: 'Supports point cloud' })).not.toBeInTheDocument()
		expect(group('Properties').getAllByText('-')).toHaveLength(2)
		expect(screen.getByText('MIME types: -')).toBeInTheDocument()
		expect(group('Intrinsics').getAllByText('-')).toHaveLength(6)
		expect(group('Distortion model').getByText('-')).toBeInTheDocument()
		expect(group('Distortion parameters').getAllByText('-')).toHaveLength(1)
		expect(screen.queryByText('fps')).not.toBeInTheDocument()
		expect(screen.queryByText('px')).not.toBeInTheDocument()
	})

	it('keeps the widget within 320 px', () => {
		cameraQueryState.properties = { supportsPcd: true, mimeTypes: ['image/jpeg'] }

		render(Host, { props: { widget: Subject } })

		expect(screen.getByTestId('pane').scrollWidth).toBeLessThanOrEqual(320)
	})
})
