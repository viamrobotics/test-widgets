import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ImageData } from '$lib/add-image-to-dataset'

import Subject from '../get-images-widget.svelte'
import {
	cameraQueryState,
	type MockImagesResponse,
	resetCameraQueryState,
} from './__fixtures__/get-query-state.svelte'
import Host from './__fixtures__/get-widget-host.svelte'

vi.mock('@viamrobotics/sdk', () => ({ CameraClient: class {} }))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { cameraQueryState: state } = await import('./__fixtures__/get-query-state.svelte')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createStreamClient: vi.fn(),
		createResourceQuery: vi.fn((_client: unknown, _method: string, args?: () => unknown[]) => ({
			get data() {
				return state.imagesData
			},
			isLoading: false,
			isError: false,
			error: null,
			refetch: () => {
				state.fetched.push('getImages')
				state.imagesArgs = typeof args === 'function' ? args() : []
				state.imagesData = state.imagesResponse
				return Promise.resolve({ data: state.imagesResponse, error: null })
			},
		})),
	}
})

const COLOR_BYTES = new Uint8Array([1, 2, 3])
const DEPTH_BYTES = new Uint8Array([4, 5, 6, 7])

const twoSourceResponse = (): MockImagesResponse => ({
	images: [
		{ sourceName: 'color', mimeType: 'image/jpeg', image: COLOR_BYTES },
		{ sourceName: 'depth', mimeType: 'image/png', image: DEPTH_BYTES },
	],
	metadata: { capturedAt: { toDate: () => new Date(2026, 10, 19, 14, 2, 11) } },
})

const getImages = () => userEvent.click(screen.getByRole('button', { name: 'Get images' }))

describe('Camera GetImages widget', () => {
	beforeEach(() => {
		resetCameraQueryState()
	})

	it('fetches nothing until Get images is pressed and reads - before a response', () => {
		cameraQueryState.imagesResponse = twoSourceResponse()

		render(Host, { props: { widget: Subject } })

		expect(screen.getByRole('heading', { name: 'GetImages' })).toBeInTheDocument()
		expect(cameraQueryState.fetched).toEqual([])
		expect(screen.getByText('-')).toBeInTheDocument()
		expect(screen.queryByRole('group', { name: /^GetImages / })).not.toBeInTheDocument()
	})

	it('draws one frame per returned image with its metadata line', async () => {
		cameraQueryState.imagesResponse = twoSourceResponse()
		render(Host, { props: { widget: Subject } })

		await getImages()

		expect(await screen.findByRole('group', { name: 'GetImages color' })).toBeInTheDocument()
		expect(screen.getByRole('group', { name: 'GetImages depth' })).toBeInTheDocument()
		expect(screen.getByText('color · image/jpeg · 2026-11-19 14:02:11')).toBeInTheDocument()
		expect(screen.getByText('depth · image/png · 2026-11-19 14:02:11')).toBeInTheDocument()
		expect(screen.getAllByRole('button', { name: 'Screenshot' })).toHaveLength(2)
	})

	it('reads - for a capture time the response does not carry', async () => {
		const response = twoSourceResponse()
		delete response.metadata
		cameraQueryState.imagesResponse = response
		render(Host, { props: { widget: Subject } })

		await getImages()

		expect(await screen.findByText('color · image/jpeg · -')).toBeInTheDocument()
	})

	it('adds each image to the dataset with its own mime type', async () => {
		const user = userEvent.setup()
		const onAddImage = vi.fn<(imageData: ImageData) => void>()
		cameraQueryState.imagesResponse = twoSourceResponse()
		render(Host, { props: { widget: Subject, onAddImage } })
		await getImages()

		const depthFrame = within(await screen.findByRole('group', { name: 'GetImages depth' }))
		await user.click(depthFrame.getByRole('button', { name: 'Add to dataset' }))
		const dialog = await screen.findByRole('dialog', { name: 'Add to dataset' })
		await vi.waitFor(() => expect(within(dialog).getByText(/image\/png/)).toBeInTheDocument())
		await user.click(within(dialog).getByRole('button', { name: 'Add' }))

		expect(onAddImage).toHaveBeenCalledOnce()
		const [imageData] = onAddImage.mock.calls[0] ?? []
		expect(imageData?.mimeType).toBe('image/png')
		expect(imageData?.methodName).toBe('getImages')
		expect([...(imageData?.binaryData ?? [])]).toEqual([...DEPTH_BYTES])
	})

	it('asks for every source by default and for one source once it is picked', async () => {
		const user = userEvent.setup()
		cameraQueryState.imagesResponse = twoSourceResponse()
		render(Host, { props: { widget: Subject } })

		await getImages()
		expect(cameraQueryState.imagesArgs).toEqual([])

		await user.click(screen.getByRole('combobox', { name: 'Source' }))
		await user.click(await screen.findByRole('option', { name: 'depth' }))
		await getImages()

		expect(cameraQueryState.imagesArgs).toEqual([['depth']])
	})

	it('shows All sources on first paint and after picking it again', async () => {
		const user = userEvent.setup()
		cameraQueryState.imagesResponse = twoSourceResponse()
		render(Host, { props: { widget: Subject } })
		const trigger = screen.getByRole('combobox', { name: 'Source' })
		expect(trigger).toHaveTextContent('All sources')

		await getImages()
		await user.click(trigger)
		await user.click(await screen.findByRole('option', { name: 'depth' }))
		expect(trigger).toHaveTextContent('depth')
		await user.click(trigger)
		await user.click(await screen.findByRole('option', { name: 'All sources' }))
		await getImages()

		expect(trigger).toHaveTextContent('All sources')
		expect(cameraQueryState.imagesArgs).toEqual([])
	})

	it('lists All sources first, then each name from the last response', async () => {
		const user = userEvent.setup()
		cameraQueryState.imagesResponse = twoSourceResponse()
		render(Host, { props: { widget: Subject } })
		await getImages()

		await user.click(screen.getByRole('combobox', { name: 'Source' }))

		const optionElements = await screen.findAllByRole('option')
		const options = optionElements.map((option) => option.textContent?.trim())
		expect(options).toEqual(['All sources', 'color', 'depth'])
	})
})

describe('Camera GetImages widget in a 320 px pane', () => {
	beforeEach(() => {
		resetCameraQueryState()
	})

	it('fits two returned frames within 320 px', async () => {
		cameraQueryState.imagesResponse = twoSourceResponse()
		render(Host, { props: { widget: Subject } })
		await getImages()

		const frame = await screen.findByRole('group', { name: 'GetImages color' })
		const pane = screen.getByTestId('pane')

		expect(pane.getBoundingClientRect().width).toBe(320)
		expect(pane.scrollWidth).toBeLessThanOrEqual(320)
		expect(frame.getBoundingClientRect().width).toBeLessThanOrEqual(320)
	})
})
