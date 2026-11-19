import { act, render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { Detection } from '@viamrobotics/sdk'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../vision-service-controls.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'
import HostSubject from './__fixtures__/vision-service-controls-host.svelte'

const state = vi.hoisted(
	(): {
		errors: Record<string, Error | null>
		data: Record<string, unknown>
		fetching: boolean
		cameras: string[]
	} => ({
		errors: {},
		data: {},
		fetching: false,
		cameras: [],
	})
)

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createStreamClient: vi.fn(() => ({ mediaStream: undefined })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			get data() {
				return state.data[method]
			},
			isLoading: false,
			isSuccess: true,
			isError: false,
			fetchStatus: 'idle',
			get isFetching() {
				return state.fetching
			},
			get error() {
				return state.errors[method] ?? null
			},
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
const WAIT_TO_START_IMAGE_KEY = 'vision-service-wait-to-start-feed/test-part/test-vision'
const WAIT_TO_START_POINT_CLOUDS_KEY =
	'vision-service-wait-to-start-point-clouds/test-part/test-vision'

const renderSubject = () => render(Subject, { props: PROPS })

const SLOW_MESSAGE = 'This request is taking a long time to complete.'
const SLOW_REQUEST_THRESHOLD_MS = 5000

const FRAME_WIDTH = 640
const FRAME_HEIGHT = 480

const FRAME_GRAY = 128

const encodeFrame = async (width: number, height: number, mimeType: string) => {
	const canvas = new OffscreenCanvas(width, height)
	const context = canvas.getContext('2d')
	if (context) {
		context.fillStyle = `rgb(${FRAME_GRAY.toString()} ${FRAME_GRAY.toString()} ${FRAME_GRAY.toString()})`
		context.fillRect(0, 0, width, height)
	}
	const blob = await canvas.convertToBlob({ type: mimeType })
	return new Uint8Array(await blob.arrayBuffer())
}

const provideFrame = async ({
	mimeType = 'image/png',
	detections = [],
}: { mimeType?: string; detections?: Detection[] } = {}) => {
	state.data.captureAllFromCamera = {
		image: { image: await encodeFrame(FRAME_WIDTH, FRAME_HEIGHT, mimeType), mimeType },
		detections,
		classifications: [],
	}
}

const BOXED_DETECTION = new Detection({
	xMin: 100n,
	yMin: 100n,
	xMax: 300n,
	yMax: 300n,
	confidence: 0.9,
	className: 'Wagyu',
})

const BOX_LEFT_EDGE_STRIP = { x: 96, y: 200, width: 12 }
const BOX_EDGE_MIN_DIFFERENCE = 16

const largestDifferenceFromGray = async (
	bitmap: ImageBitmap,
	strip: { x: number; y: number; width: number }
) => {
	const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
	const context = canvas.getContext('2d')
	if (!context) throw new Error('No 2D context to read the screenshot')
	context.drawImage(bitmap, 0, 0)
	const pixels = context.getImageData(strip.x, strip.y, strip.width, 1).data
	return Math.max(
		...pixels.filter((_, index) => index % 4 !== 3).map((channel) => Math.abs(channel - FRAME_GRAY))
	)
}

const captureSavedBlobs = () => {
	const blobsByUrl = new Map<string, Blob>()
	const saved: Blob[] = []
	const createObjectURL = URL.createObjectURL.bind(URL)
	vi.spyOn(URL, 'createObjectURL').mockImplementation((object) => {
		const url = createObjectURL(object)
		if (object instanceof Blob) blobsByUrl.set(url, object)
		return url
	})
	vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
		this: HTMLAnchorElement
	) {
		const blob = blobsByUrl.get(this.href)
		if (blob) saved.push(blob)
	})
	return saved
}

const waitForFrame = async (root: ParentNode) => {
	await vi.waitFor(() => {
		const image = root.querySelector('img')
		expect(image?.naturalWidth).toBe(FRAME_WIDTH)
		expect(within(document.body).getByRole('button', { name: 'Legend' })).toBeInTheDocument()
	})
	const image = root.querySelector('img')
	if (!(image?.parentElement instanceof HTMLElement)) throw new Error('No media box was drawn')
	return image.parentElement
}

const getQueryOptions = (method: string) => {
	const call = vi.mocked(createResourceQuery).mock.calls.findLast(([, name]) => name === method)
	if (call === undefined) throw new Error(`No query was created for ${method}`)
	const args = call[2]
	const options = call[3]
	return { args, options }
}

const callIfFunction = (value: unknown): unknown => (typeof value === 'function' ? value() : value)

const imageGroup = () => screen.getByRole('group', { name: 'CaptureAllFromCamera' })
const pointCloudsGroup = () => screen.getByRole('group', { name: 'GetObjectPointClouds' })

const PROPERTIES = {
	classificationsSupported: false,
	detectionsSupported: true,
	objectPointCloudsSupported: true,
	defaultCamera: '',
}

const renderInObjectPointCloudsMode = async () => {
	state.data.getProperties = PROPERTIES
	renderSubject()
	await userEvent.click(screen.getByRole('radio', { name: 'Object point clouds' }))
}

describe('VisionServiceControls', () => {
	beforeEach(() => {
		state.errors = {}
		state.data = {}
		state.fetching = false
		state.cameras = []
		localStorage.clear()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('renders the CaptureAllFromCamera section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'CaptureAllFromCamera' })).toBeInTheDocument()
	})

	it('draws the Camera row with Default camera and no Is remote? checkbox', () => {
		renderSubject()

		expect(screen.getByRole('combobox', { name: 'Camera' })).toHaveTextContent('Default camera')
		expect(screen.queryByRole('checkbox', { name: 'Is remote?' })).not.toBeInTheDocument()
	})

	it('sends the selected camera name unchanged, with no remote prefix stripped', () => {
		state.cameras = ['remote:cam']
		renderSubject()

		expect(callIfFunction(getQueryOptions('captureAllFromCamera').args)).toEqual([
			'remote:cam',
			expect.anything(),
		])
	})

	it('starts the image automatically by default', () => {
		renderSubject()

		expect(
			within(imageGroup()).getByRole('checkbox', { name: 'Start feed automatically' })
		).toBeChecked()
		expect(screen.queryByRole('button', { name: 'Start feed' })).not.toBeInTheDocument()
		expect(callIfFunction(getQueryOptions('captureAllFromCamera').options)).toMatchObject({
			enabled: true,
		})
	})

	it('stores a wait and shows the splash when Start feed automatically is unchecked', async () => {
		renderSubject()

		await userEvent.click(
			within(imageGroup()).getByRole('checkbox', { name: 'Start feed automatically' })
		)

		expect(localStorage.getItem(WAIT_TO_START_IMAGE_KEY)).toBe('true')
		expect(screen.getByRole('button', { name: 'Start feed' })).toBeInTheDocument()
		expect(callIfFunction(getQueryOptions('captureAllFromCamera').options)).toMatchObject({
			enabled: false,
		})
	})

	it('starts a waiting image from the splash', async () => {
		localStorage.setItem(WAIT_TO_START_IMAGE_KEY, 'true')
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Start feed' }))

		expect(screen.queryByRole('button', { name: 'Start feed' })).not.toBeInTheDocument()
		expect(callIfFunction(getQueryOptions('captureAllFromCamera').options)).toMatchObject({
			enabled: true,
		})
	})

	it('draws the refresh row inside the CaptureAllFromCamera frame', () => {
		renderSubject()

		expect(within(imageGroup()).getByRole('combobox', { name: 'Refresh rate' })).toBeInTheDocument()
	})

	it('hides Add to dataset when the app provides no dataset context', () => {
		renderSubject()

		expect(screen.queryByRole('button', { name: 'Add to dataset' })).not.toBeInTheDocument()
	})

	it('adds the raw frame under the selected camera and its own mime type', async () => {
		state.cameras = ['cam-1']
		await provideFrame({ mimeType: 'image/jpeg' })
		const onAddImage = vi.fn()
		render(HostSubject, { props: { onAddImage, paneClass: 'w-80' } })
		await waitForFrame(screen.getByTestId('pane'))

		await userEvent.click(within(imageGroup()).getByRole('button', { name: 'Add to dataset' }))
		await vi.waitFor(() => {
			expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled()
		})
		await userEvent.click(screen.getByRole('button', { name: 'Add' }))

		await vi.waitFor(() => {
			expect(onAddImage).toHaveBeenCalledWith(
				expect.objectContaining({
					componentType: 'camera',
					componentName: 'cam-1',
					methodName: 'captureAllFromCamera',
					mimeType: 'image/jpeg',
				})
			)
		})
	})

	it('renders with no pip provider and shows no Picture-in-picture button', async () => {
		await provideFrame()
		renderSubject()

		await waitForFrame(document.body)

		expect(imageGroup()).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Picture-in-picture' })).not.toBeInTheDocument()
	})

	it('shows Picture-in-picture under a pip provider', () => {
		render(HostSubject, { props: { withPip: true } })

		expect(
			within(imageGroup()).getByRole('button', { name: 'Picture-in-picture' })
		).toBeInTheDocument()
	})

	it('saves a screenshot of the frame with its boxes at the frame resolution', async () => {
		await provideFrame({ detections: [BOXED_DETECTION] })
		const saved = captureSavedBlobs()
		render(HostSubject, { props: { paneClass: 'w-80' } })
		await waitForFrame(screen.getByTestId('pane'))

		await userEvent.click(within(imageGroup()).getByRole('button', { name: 'Screenshot' }))

		await vi.waitFor(() => {
			expect(saved).toHaveLength(1)
		})
		const [blob] = saved
		if (blob === undefined) throw new Error('No screenshot was saved')
		const bitmap = await createImageBitmap(blob)
		expect([bitmap.width, bitmap.height]).toEqual([FRAME_WIDTH, FRAME_HEIGHT])
		expect(
			await largestDifferenceFromGray(bitmap, BOX_LEFT_EDGE_STRIP),
			'a screenshot without the boxes is plain gray along the box edge'
		).toBeGreaterThan(BOX_EDGE_MIN_DIFFERENCE)
	})

	it('shows no Mode toggle before GetProperties answers', () => {
		renderSubject()

		expect(screen.queryByRole('radio', { name: 'Object point clouds' })).not.toBeInTheDocument()
		expect(imageGroup()).toBeInTheDocument()
	})

	it('shows no Mode toggle when GetProperties reports object point clouds unsupported', () => {
		state.data.getProperties = { ...PROPERTIES, objectPointCloudsSupported: false }

		renderSubject()

		expect(screen.queryByRole('radio', { name: 'Object point clouds' })).not.toBeInTheDocument()
		expect(screen.queryByRole('heading', { name: 'GetObjectPointClouds' })).not.toBeInTheDocument()
	})

	it('opens on Detections mode when GetProperties reports object point clouds supported', () => {
		state.data.getProperties = PROPERTIES

		renderSubject()

		expect(screen.getByRole('radio', { name: 'Detections' })).toBeChecked()
		expect(screen.getByRole('heading', { name: 'CaptureAllFromCamera' })).toBeInTheDocument()
		expect(screen.queryByRole('group', { name: 'GetObjectPointClouds' })).not.toBeInTheDocument()
	})

	it('swaps the capture for the object point clouds splash and checkbox in Object point clouds mode', async () => {
		await renderInObjectPointCloudsMode()

		expect(screen.getByRole('heading', { name: 'GetObjectPointClouds' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Start object point clouds' })).toBeInTheDocument()
		expect(
			within(pointCloudsGroup()).getByRole('checkbox', { name: 'Start feed automatically' })
		).not.toBeChecked()
		expect(screen.queryByRole('group', { name: 'CaptureAllFromCamera' })).not.toBeInTheDocument()
	})

	it('stops the capture query while Object point clouds mode is shown', async () => {
		await renderInObjectPointCloudsMode()

		expect(callIfFunction(getQueryOptions('captureAllFromCamera').options)).toMatchObject({
			enabled: false,
		})
	})

	it('draws the Camera row last in the Object point clouds group', async () => {
		await renderInObjectPointCloudsMode()

		const lastControl = within(pointCloudsGroup()).getAllByRole('combobox').at(-1)
		expect(lastControl).toHaveAccessibleName('Camera')
	})

	it('shows the GetObjectPointClouds splash until Start object point clouds is pressed', async () => {
		await renderInObjectPointCloudsMode()
		expect(within(pointCloudsGroup()).getByRole('button', { name: 'Refresh' })).toBeInTheDocument()

		await userEvent.click(screen.getByRole('button', { name: 'Start object point clouds' }))

		expect(
			screen.queryByRole('button', { name: 'Start object point clouds' })
		).not.toBeInTheDocument()
	})

	it('stores the point clouds start setting with its wait polarity', async () => {
		await renderInObjectPointCloudsMode()

		await userEvent.click(
			within(pointCloudsGroup()).getByRole('checkbox', { name: 'Start feed automatically' })
		)

		expect(localStorage.getItem(WAIT_TO_START_POINT_CLOUDS_KEY)).toBe('false')
	})

	it('sends GetObjectPointClouds for the selected camera, only once started', async () => {
		state.cameras = ['cam-1']
		await renderInObjectPointCloudsMode()

		const before = getQueryOptions('getObjectPointClouds')
		expect(callIfFunction(before.args)).toEqual(['cam-1'])
		expect(callIfFunction(before.options)).toMatchObject({ enabled: false })

		await userEvent.click(screen.getByRole('button', { name: 'Start object point clouds' }))

		expect(callIfFunction(getQueryOptions('getObjectPointClouds').options)).toMatchObject({
			enabled: true,
		})
	})

	it('keeps GetObjectPointClouds off in Detections mode, even with its start setting on', () => {
		localStorage.setItem(WAIT_TO_START_POINT_CLOUDS_KEY, 'false')
		state.data.getProperties = PROPERTIES

		renderSubject()

		expect(callIfFunction(getQueryOptions('getObjectPointClouds').options)).toMatchObject({
			enabled: false,
		})
	})

	it("shows a failing capture query in the section's error indicator", () => {
		state.errors.captureAllFromCamera = new Error('capture failed')

		renderSubject()

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})

	it("shows a failing point cloud query in the section's error indicator", async () => {
		state.errors.getObjectPointClouds = new Error('point clouds failed')
		await renderInObjectPointCloudsMode()

		await userEvent.click(screen.getByRole('button', { name: 'Start object point clouds' }))

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})

	it('shows the slow request message once a fetch passes the threshold', async () => {
		vi.useFakeTimers()
		state.fetching = true
		renderSubject()
		expect(screen.queryByText(SLOW_MESSAGE)).not.toBeInTheDocument()

		await act(() => vi.advanceTimersByTimeAsync(SLOW_REQUEST_THRESHOLD_MS))

		expect(screen.getAllByText(SLOW_MESSAGE).length).toBeGreaterThan(0)
	})

	it('shows no slow request message for started point clouds that are not fetching', async () => {
		await renderInObjectPointCloudsMode()

		await userEvent.click(screen.getByRole('button', { name: 'Start object point clouds' }))

		expect(screen.queryByText(SLOW_MESSAGE)).not.toBeInTheDocument()
	})

	it('opens the legend from 672 px', async () => {
		await provideFrame()
		const target = document.createElement('div')
		target.style.width = '720px'
		document.body.append(target)

		render(Subject, { props: PROPS, target })
		await waitForFrame(target)

		expect(within(target).getByRole('button', { name: 'Legend' })).toHaveAttribute(
			'aria-expanded',
			'true'
		)
		target.remove()
	})
})

describe('VisionServiceControls in a 320 px pane', () => {
	beforeEach(() => {
		state.errors = {}
		state.data = {}
		state.fetching = false
		state.cameras = []
		localStorage.clear()
	})

	it('fits the widget root and the pane within 320 px', () => {
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})

	it('draws the frame at the full pane width and its ratio, with the boxes canvas on it', async () => {
		await provideFrame()
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')

		const box = await waitForFrame(pane)
		const boxRect = box.getBoundingClientRect()

		expect(boxRect.width).toBeCloseTo(pane.clientWidth, 0)
		expect(boxRect.height).toBeCloseTo((boxRect.width * FRAME_HEIGHT) / FRAME_WIDTH, 0)
		const canvas = box.querySelector('canvas')
		if (canvas === null) throw new Error('No boxes canvas was drawn')
		expect(canvas.getBoundingClientRect().width).toBeCloseTo(boxRect.width, 0)
		expect(canvas.getBoundingClientRect().height).toBeCloseTo(boxRect.height, 0)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})

	it('starts the legend collapsed below 672 px', async () => {
		await provideFrame()
		render(PaneSubject, { props: { widget: Subject } })

		await waitForFrame(screen.getByTestId('pane'))

		expect(screen.getByRole('button', { name: 'Legend' })).toHaveAttribute('aria-expanded', 'false')
	})
})
