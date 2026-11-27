import type { ImageData } from '#lib/add-image-to-dataset.js'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetImagesWidget.svelte'
import {
	cameraQueryState,
	type MockImagesResponse,
	resetCameraQueryState,
} from './__fixtures__/get-query-state.svelte'
import Host from './__fixtures__/GetWidgetHost.svelte'

interface RefetchResult {
	data: MockImagesResponse | undefined
	error: Error | null
}

const refetchOverride = vi.hoisted((): { current: (() => Promise<RefetchResult>) | undefined } => ({
	current: undefined,
}))

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
				if (refetchOverride.current) return refetchOverride.current()
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

const BUSY_REASON = 'Wait for the images in flight to finish.'

const getImages = () => userEvent.click(screen.getByRole('button', { name: 'Get images' }))

describe('Camera GetImages widget', () => {
	beforeEach(() => {
		resetCameraQueryState()
		refetchOverride.current = undefined
	})

	it('fetches nothing until Get images is pressed and says so before a response', () => {
		cameraQueryState.imagesResponse = twoSourceResponse()

		render(Host, { props: { widget: Subject } })

		expect(screen.getByRole('heading', { name: 'GetImages' })).toBeInTheDocument()
		expect(cameraQueryState.fetched).toEqual([])
		expect(screen.getByText('No images yet. Press Get images to fetch them.')).toBeInTheDocument()
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

	it("keeps the drawn frames' preview URLs alive, and revokes them on the next fetch", async () => {
		cameraQueryState.imagesResponse = twoSourceResponse()
		const revoke = vi.spyOn(URL, 'revokeObjectURL')
		render(Host, { props: { widget: Subject } })

		await userEvent.click(screen.getByRole('button', { name: 'Get images' }))
		const images = await screen.findAllByRole('img')
		const drawn = images.map((image) => image.getAttribute('src'))

		expect(drawn).toHaveLength(2)
		expect(revoke.mock.calls.flat()).toEqual([])

		await userEvent.click(screen.getByRole('button', { name: 'Get images' }))

		await vi.waitFor(() => expect(revoke.mock.calls.flat()).toEqual(drawn))
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

	it('writes Get images failed to the status line when the fetch returns an error', async () => {
		refetchOverride.current = () =>
			Promise.resolve({ data: undefined, error: new Error('no images') })
		render(Host, { props: { widget: Subject } })

		await getImages()

		expect(await screen.findByText('Get images failed')).toBeInTheDocument()
		expect(screen.getByText('No images yet. Press Get images to fetch them.')).toBeInTheDocument()
	})

	it('holds Get images back with its reason while a fetch is in flight, and makes no second call', async () => {
		const pending = Promise.withResolvers<RefetchResult>()
		refetchOverride.current = () => pending.promise
		render(Host, { props: { widget: Subject } })
		const button = screen.getByRole('button', { name: 'Get images' })

		await userEvent.click(button)

		expect(button).toHaveAttribute('aria-disabled', 'true')
		expect(button).not.toHaveAttribute('disabled')
		expect(button).toHaveAccessibleDescription(BUSY_REASON)
		await userEvent.click(button)
		expect(cameraQueryState.fetched).toEqual(['getImages'])

		pending.resolve({ data: twoSourceResponse(), error: null })

		await screen.findByRole('group', { name: 'GetImages color' })
		expect(button).not.toHaveAttribute('aria-disabled')
	})

	it('asks for every source while the Sources field is empty', async () => {
		cameraQueryState.imagesResponse = twoSourceResponse()
		render(Host, { props: { widget: Subject } })
		expect(screen.getByRole('textbox', { name: 'Sources' })).toHaveValue('')

		await getImages()

		expect(cameraQueryState.imagesArgs).toEqual([])
	})

	it('asks for each typed source name, seen before or not', async () => {
		const user = userEvent.setup()
		cameraQueryState.imagesResponse = twoSourceResponse()
		render(Host, { props: { widget: Subject } })

		await user.type(screen.getByRole('textbox', { name: 'Sources' }), ' depth , thermal,, ')
		await getImages()

		expect(cameraQueryState.imagesArgs).toEqual([['depth', 'thermal']])
	})

	it('asks for every source again once the field is cleared', async () => {
		const user = userEvent.setup()
		cameraQueryState.imagesResponse = twoSourceResponse()
		render(Host, { props: { widget: Subject } })
		const sources = screen.getByRole('textbox', { name: 'Sources' })

		await user.type(sources, 'depth')
		await getImages()
		await user.clear(sources)
		await getImages()

		expect(cameraQueryState.imagesArgs).toEqual([])
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
