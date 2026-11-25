import { fireEvent, render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { MachineConnectionEvent } from '@viamrobotics/sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { MediaFit } from '$lib/components/media-frame/media-fit'

import { RefetchRates } from '$lib/components/refetch-interval-store.svelte'

import { pcd } from '../../pcd/__tests__/__fixtures__/pcd'
import CameraControls from '../camera-controls.svelte'
import Subject from './__fixtures__/camera-controls-host.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

interface MockImage {
	sourceName: string
	mimeType: string
	image: Uint8Array
}

interface MockProperties {
	supportsPcd: boolean
}

interface MockQuery<TData> {
	data: TData | undefined
	isLoading: boolean
	isError: boolean
	error: Error | null
	fetchStatus: 'idle' | 'fetching'
	refetch: () => Promise<{ error: Error | null; data: TData | undefined }>
}

interface MockQueryOptions {
	enabled?: boolean
	refetchInterval?: number | false
}

const state = vi.hoisted(
	(): {
		images: MockImage[] | undefined
		imagesError: Error | null
		properties: MockProperties | undefined
		pointcloud: Uint8Array | undefined
		pointcloudError: Error | null
		pointcloudIsLoading: boolean
		pointcloudOptions: (() => MockQueryOptions) | undefined
		robotClient: object | undefined
	} => ({
		images: undefined,
		imagesError: null,
		properties: undefined,
		pointcloud: undefined,
		pointcloudError: null,
		pointcloudIsLoading: false,
		pointcloudOptions: undefined,
		robotClient: undefined,
	})
)

const stream = vi.hoisted(() => {
	const failures: Error[] = []
	return { getStream: vi.fn<(name: string) => void>(), failures }
})

vi.mock('@viamrobotics/sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/sdk')>()),
	StreamClient: class {
		on() {}

		off() {}

		async getStream(name: string) {
			stream.getStream(name)
			const failure = stream.failures.shift()
			if (failure) throw failure
		}

		async getOptions() {
			return []
		}

		async remove() {}
	},
}))

const createMockQuery = <TData>(
	getError: () => Error | null,
	getIsLoading = () => false,
	getData = (): TData | undefined => undefined
): MockQuery<TData> => ({
	get data() {
		return getData()
	},
	get isLoading() {
		return getIsLoading()
	},
	get isError() {
		return getError() !== null
	},
	get error() {
		return getError()
	},
	fetchStatus: 'idle',
	refetch: () => Promise.resolve({ error: getError(), data: getData() }),
})

const imagesResponse = () => (state.images ? { images: state.images } : undefined)

vi.mock('@viamrobotics/svelte-sdk', () => ({
	useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	useRobotClient: vi.fn(() => ({ current: state.robotClient })),
	createResourceClient: vi.fn(() => ({ current: undefined })),
	// GetPointCloud and GetProperties take no arguments, so their third parameter is the options getter.
	createResourceQuery: vi.fn(
		(_client: unknown, method: string, options?: () => MockQueryOptions): MockQuery<unknown> => {
			if (method === 'getProperties') {
				return createMockQuery(
					() => null,
					() => false,
					() => state.properties
				)
			}

			if (method !== 'getPointCloud') {
				return createMockQuery(
					() => state.imagesError,
					() => false,
					imagesResponse
				)
			}

			state.pointcloudOptions = options
			return createMockQuery(
				() => state.pointcloudError,
				() => state.pointcloudIsLoading,
				() => state.pointcloud
			)
		}
	),
	createStreamClient: vi.fn(),
}))

const partID = 'test-part'
const resourceName = 'test-camera'
const waitToStartFeedKey = `camera-wait-to-start-feed/${partID}/${resourceName}`
const waitToStartPointCloudKey = `camera-wait-to-start-point-cloud/${partID}/${resourceName}`
const pointCloudRateKey = `control-card-refresh/${partID}/${resourceName}/camera-point-cloud`
const feedRateKey = `control-card-refresh/${partID}/${resourceName}/camera`
const imageFitKey = `camera-media-fit/${partID}/${resourceName}`
const pointCloudFitKey = `camera-point-cloud-fit/${partID}/${resourceName}`
const LIVE_INTERVAL = '33.3333'

const controlsSection = () => {
	const section = screen.getByRole('heading', { name: 'Live feed' }).closest('section')
	if (!section) throw new Error('No section around the Live feed heading')
	return within(section)
}

const groupFor = (mode: string) => within(screen.getByRole('group', { name: mode }))

const startsAutomatically = (mode: string) =>
	groupFor(mode).getByRole('checkbox', { name: 'Start feed automatically' })

const mediaBoxAspectRatio = (inside: HTMLElement) =>
	inside.closest<HTMLElement>('[style*="aspect-ratio"]')?.style.aspectRatio

const renderDroppedLiveStream = () => {
	localStorage.setItem(feedRateKey, LIVE_INTERVAL)
	state.robotClient = {}
	stream.failures.push(new Error('stream dropped'))
	render(Subject, { props: { partID, resourceName, autoplay: true } })
}

const fitOptions = async (mode: string) => {
	await userEvent.click(groupFor(mode).getByRole('combobox', { name: 'Fit' }))
	const options = await screen.findAllByRole('option')
	return options.map((option) => option.textContent?.trim())
}

const pointCloudOptions = (): MockQueryOptions => {
	if (!state.pointcloudOptions) throw new Error('GetPointCloud was never queried')
	return state.pointcloudOptions()
}

const renderInPointCloudMode = async () => {
	state.properties = { supportsPcd: true }
	render(Subject, { props: { partID, resourceName } })
	await userEvent.click(screen.getByRole('radio', { name: 'Point cloud' }))
}

describe('Camera LiveFeed', () => {
	beforeEach(() => {
		localStorage.setItem(waitToStartFeedKey, 'true')
		state.images = undefined
		state.imagesError = null
		state.properties = undefined
		state.pointcloud = undefined
		state.pointcloudError = null
		state.pointcloudIsLoading = false
		state.pointcloudOptions = undefined
		state.robotClient = undefined
		stream.failures.length = 0
	})

	afterEach(() => {
		localStorage.removeItem(waitToStartFeedKey)
		localStorage.removeItem(waitToStartPointCloudKey)
		localStorage.removeItem(pointCloudRateKey)
		localStorage.removeItem(feedRateKey)
		localStorage.removeItem(imageFitKey)
		localStorage.removeItem(pointCloudFitKey)
	})

	it('waits for the user to start the feed when the saved preference is off', () => {
		render(Subject, { props: { partID, resourceName } })

		expect(screen.getByRole('button', { name: 'Start feed' })).toBeInTheDocument()
		expect(startsAutomatically('Image')).not.toBeChecked()
	})

	it('starts the feed on mount with autoplay while leaving the saved preference off', () => {
		render(Subject, { props: { partID, resourceName, autoplay: true } })

		expect(screen.queryByRole('button', { name: 'Start feed' })).not.toBeInTheDocument()
		expect(startsAutomatically('Image')).not.toBeChecked()
		expect(localStorage.getItem(waitToStartFeedKey)).toBe('true')
	})

	it('saves a checked Start feed automatically as no longer waiting', async () => {
		render(Subject, { props: { partID, resourceName } })

		await userEvent.click(startsAutomatically('Image'))

		expect(startsAutomatically('Image')).toBeChecked()
		expect(localStorage.getItem(waitToStartFeedKey)).toBe('false')
		expect(screen.queryByRole('button', { name: 'Start feed' })).not.toBeInTheDocument()
	})

	it('shows no Mode toggle before GetProperties answers', () => {
		render(Subject, { props: { partID, resourceName } })

		expect(screen.queryByRole('radio', { name: 'Point cloud' })).not.toBeInTheDocument()
		expect(screen.getByRole('group', { name: 'Image' })).toBeInTheDocument()
	})

	it('shows no Mode toggle when GetProperties reports no point cloud support', () => {
		state.properties = { supportsPcd: false }

		render(Subject, { props: { partID, resourceName } })

		expect(screen.queryByRole('radio', { name: 'Point cloud' })).not.toBeInTheDocument()
		expect(screen.getByRole('group', { name: 'Image' })).toBeInTheDocument()
	})

	it('opens on Image mode when GetProperties reports point cloud support', () => {
		state.properties = { supportsPcd: true }

		render(Subject, { props: { partID, resourceName } })

		expect(screen.getByRole('radio', { name: 'Image' })).toBeChecked()
		expect(screen.getByRole('group', { name: 'Image' })).toBeInTheDocument()
	})

	it('never queries the point cloud in Image mode', () => {
		localStorage.setItem(waitToStartPointCloudKey, 'false')
		state.properties = { supportsPcd: true }

		render(Subject, { props: { partID, resourceName } })

		expect(pointCloudOptions().enabled).toBe(false)
	})

	it('swaps the feed for the Start point cloud splash and its own checkbox in Point cloud mode', async () => {
		await renderInPointCloudMode()

		expect(screen.getByRole('button', { name: 'Start point cloud' })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Start feed' })).not.toBeInTheDocument()
		expect(startsAutomatically('Point cloud')).not.toBeChecked()
	})

	it('waits for the user to start the point cloud by default', async () => {
		await renderInPointCloudMode()

		expect(pointCloudOptions().enabled).toBe(false)
	})

	it('starts the point cloud from its splash without saving the preference', async () => {
		await renderInPointCloudMode()

		await userEvent.click(screen.getByRole('button', { name: 'Start point cloud' }))

		expect(pointCloudOptions().enabled).toBe(true)
		expect(screen.queryByRole('button', { name: 'Start point cloud' })).not.toBeInTheDocument()
		expect(localStorage.getItem(waitToStartPointCloudKey)).toBe('true')
		expect(startsAutomatically('Point cloud')).not.toBeChecked()
	})

	it('starts the point cloud from its checkbox and saves it as no longer waiting', async () => {
		await renderInPointCloudMode()

		await userEvent.click(startsAutomatically('Point cloud'))

		expect(pointCloudOptions().enabled).toBe(true)
		expect(localStorage.getItem(waitToStartPointCloudKey)).toBe('false')
	})

	it('starts the point cloud on entering Point cloud mode when its saved preference is on', async () => {
		localStorage.setItem(waitToStartPointCloudKey, 'false')

		await renderInPointCloudMode()

		expect(screen.queryByRole('button', { name: 'Start point cloud' })).not.toBeInTheDocument()
		expect(pointCloudOptions().enabled).toBe(true)
	})

	it('offers Live on the feed refresh row', async () => {
		render(Subject, { props: { partID, resourceName } })

		await userEvent.click(groupFor('Image').getByRole('combobox', { name: 'Refresh rate' }))

		expect(await screen.findByRole('option', { name: RefetchRates.LIVE })).toBeInTheDocument()
	})

	it('offers no Live on the point cloud refresh row', async () => {
		await renderInPointCloudMode()

		await userEvent.click(groupFor('Point cloud').getByRole('combobox', { name: 'Refresh rate' }))
		await screen.findAllByRole('option')

		expect(screen.queryByRole('option', { name: RefetchRates.LIVE })).not.toBeInTheDocument()
	})

	it('polls the point cloud once a second by default', () => {
		render(Subject, { props: { partID, resourceName } })

		expect(pointCloudOptions().refetchInterval).toBe(1000)
	})

	it('never polls the point cloud faster than once a second', () => {
		localStorage.setItem(pointCloudRateKey, '33.3333')
		render(Subject, { props: { partID, resourceName } })

		expect(pointCloudOptions().refetchInterval).toBe(1000)
	})

	it('shows the controls under the feed as checkboxes', () => {
		render(Subject, { props: { partID, resourceName, autoplay: true } })

		expect(
			groupFor('Image').getByRole('checkbox', { name: 'Mouse position tooltip' })
		).not.toBeChecked()
	})

	it("shows the point cloud error in the section's indicator", async () => {
		state.pointcloudError = new Error('no depth sensor')
		await renderInPointCloudMode()

		await userEvent.click(screen.getByRole('button', { name: 'Start point cloud' }))

		expect(
			controlsSection().getByRole('button', { name: '1 error, copy to clipboard' })
		).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Copy error' })).not.toBeInTheDocument()
	})

	it('shows a progress bar while the point cloud loads', async () => {
		state.pointcloudIsLoading = true
		await renderInPointCloudMode()

		await userEvent.click(screen.getByRole('button', { name: 'Start point cloud' }))

		expect(controlsSection().getByRole('progressbar')).toBeInTheDocument()
	})

	it('disables the feed actions until the feed starts', () => {
		render(Subject, { props: { partID, resourceName } })

		expect(screen.getByRole('button', { name: 'Screenshot' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Picture-in-picture' })).toBeDisabled()
	})

	it("shows a failed screenshot export in the section's indicator", async () => {
		render(Subject, { props: { partID, resourceName, autoplay: true } })
		state.imagesError = new Error('export failed')

		await userEvent.click(screen.getByRole('button', { name: /screenshot/iu }))

		expect(
			await controlsSection().findByRole('button', { name: '1 error, copy to clipboard' })
		).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Copy error' })).not.toBeInTheDocument()
	})

	it("shows a refused picture-in-picture request in the section's indicator", async () => {
		vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(
			HTMLMediaElement.HAVE_METADATA
		)
		vi.spyOn(HTMLVideoElement.prototype, 'requestPictureInPicture').mockRejectedValue(
			new Error('pip denied')
		)
		render(Subject, { props: { partID, resourceName, autoplay: true } })

		await userEvent.click(screen.getByRole('button', { name: /picture-in-picture/iu }))

		const indicator = await controlsSection().findByRole('button', {
			name: '1 error, copy to clipboard',
		})
		await fireEvent.focusIn(indicator)
		expect(screen.getByText('Error: pip denied')).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Copy error' })).not.toBeInTheDocument()
	})

	it('counts a failed GetImages poll in the section indicator', async () => {
		state.imagesError = new Error('camera offline')

		render(Subject, { props: { partID, resourceName, autoplay: true } })

		expect(
			await controlsSection().findByRole('button', { name: '1 error, copy to clipboard' })
		).toBeInTheDocument()
	})

	it('draws no error text over the feed for a failed GetImages poll', async () => {
		state.imagesError = new Error('camera offline')

		render(Subject, { props: { partID, resourceName, autoplay: true } })

		await controlsSection().findByRole('button', { name: '1 error, copy to clipboard' })
		expect(screen.queryByText('Error: camera offline')).not.toBeInTheDocument()
	})

	it('titles the section Live feed with the errors indicator in its aside', () => {
		render(Subject, { props: { partID, resourceName } })

		expect(controlsSection().getByRole('button', { name: 'No errors' })).toBeInTheDocument()
		expect(screen.queryByRole('heading', { name: 'GetImages' })).not.toBeInTheDocument()
	})

	it('keeps the Live feed title in Point cloud mode', async () => {
		await renderInPointCloudMode()

		expect(screen.getByRole('heading', { name: 'Live feed' })).toBeInTheDocument()
		expect(screen.queryByRole('heading', { name: 'GetPointCloud' })).not.toBeInTheDocument()
	})

	it('draws Resolution while Live as a plain row with extra-small Reset and Execute', () => {
		localStorage.setItem(feedRateKey, LIVE_INTERVAL)

		render(Subject, { props: { partID, resourceName, autoplay: true } })

		const feed = groupFor('Image')
		expect(feed.getByRole('combobox', { name: 'Resolution (width x height)' })).toBeInTheDocument()
		expect(feed.getByRole('button', { name: 'Reset' })).toHaveClass('button-xs')
		expect(feed.getByRole('button', { name: 'Execute' })).toHaveClass('button-xs')
		expect(screen.queryByRole('heading', { name: 'SetStreamOptions' })).not.toBeInTheDocument()
	})

	it('counts a dropped Live stream in the section indicator', async () => {
		renderDroppedLiveStream()

		expect(
			await controlsSection().findByRole('button', { name: '1 error, copy to clipboard' })
		).toBeInTheDocument()
	})

	it('draws no error text over the feed for a dropped Live stream', async () => {
		renderDroppedLiveStream()

		await controlsSection().findByRole('button', { name: '1 error, copy to clipboard' })
		expect(screen.queryByText('Error: stream dropped')).not.toBeInTheDocument()
	})

	it('returns the Start feed splash after a dropped Live stream', async () => {
		renderDroppedLiveStream()

		expect(await screen.findByRole('button', { name: 'Start feed' })).toBeInTheDocument()
	})

	it('restarts the Live stream from Start feed after it drops', async () => {
		renderDroppedLiveStream()
		const startFeed = await screen.findByRole('button', { name: 'Start feed' })

		await userEvent.click(startFeed)

		await vi.waitFor(() => {
			expect(stream.getStream).toHaveBeenCalledTimes(2)
		})
		expect(screen.queryByRole('button', { name: 'Start feed' })).not.toBeInTheDocument()
	})

	it('hides Resolution while the feed polls', () => {
		render(Subject, { props: { partID, resourceName, autoplay: true } })

		expect(
			screen.queryByRole('combobox', { name: 'Resolution (width x height)' })
		).not.toBeInTheDocument()
	})

	it('puts Start feed automatically before Screenshot once the point cloud runs', async () => {
		localStorage.setItem(waitToStartPointCloudKey, 'false')
		state.pointcloud = new TextEncoder().encode(pcd)

		await renderInPointCloudMode()

		const checkbox = startsAutomatically('Point cloud')
		const screenshot = groupFor('Point cloud').getByRole('button', { name: 'Screenshot' })
		expect(
			checkbox.compareDocumentPosition(screenshot) & Node.DOCUMENT_POSITION_FOLLOWING,
			'the checkbox precedes Screenshot'
		).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
	})

	it('stops the running point cloud from its frame checkbox', async () => {
		localStorage.setItem(waitToStartPointCloudKey, 'false')
		state.pointcloud = new TextEncoder().encode(pcd)
		await renderInPointCloudMode()

		await userEvent.click(startsAutomatically('Point cloud'))

		expect(localStorage.getItem(waitToStartPointCloudKey)).toBe('true')
	})

	it('shows Screenshot and Picture-in-picture disabled on the point cloud splash', async () => {
		await renderInPointCloudMode()

		const splash = groupFor('Point cloud')
		expect(splash.getByRole('button', { name: 'Screenshot' })).toBeDisabled()
		expect(splash.getByRole('button', { name: 'Picture-in-picture' })).toBeDisabled()
	})

	it('offers every fit for the image feed', async () => {
		render(Subject, { props: { partID, resourceName } })

		expect(await fitOptions('Image')).toEqual(['Keep ratio', 'Fit', 'Stretch', 'Crop to fill'])
	})

	it('offers Keep ratio and Fit only for a point cloud view', async () => {
		await renderInPointCloudMode()

		expect(await fitOptions('Point cloud')).toEqual(['Keep ratio', 'Fit'])
	})

	it('offers Keep ratio and Fit only once the point cloud runs', async () => {
		localStorage.setItem(waitToStartPointCloudKey, 'false')
		state.pointcloud = new TextEncoder().encode(pcd)
		await renderInPointCloudMode()

		expect(await fitOptions('Point cloud')).toEqual(['Keep ratio', 'Fit'])
	})

	it('saves the point cloud fit apart from the image fit', async () => {
		await renderInPointCloudMode()
		await userEvent.click(groupFor('Point cloud').getByRole('combobox', { name: 'Fit' }))

		await userEvent.click(await screen.findByRole('option', { name: 'Fit' }))

		expect(localStorage.getItem(pointCloudFitKey)).toBe('"fit"')
		expect(localStorage.getItem(imageFitKey)).toBeNull()
	})

	it.each([
		{ fit: 'keep-ratio', objectFit: 'contain' },
		{ fit: 'fit', objectFit: 'contain' },
		{ fit: 'stretch', objectFit: 'fill' },
		{ fit: 'crop', objectFit: 'cover' },
	])(
		'draws the video at object-fit $objectFit under the saved $fit, which the cursor tooltip reads',
		({ fit, objectFit }) => {
			localStorage.setItem(imageFitKey, JSON.stringify(fit))

			render(Subject, { props: { partID, resourceName, autoplay: true } })

			expect(getComputedStyle(screen.getByLabelText(`${resourceName} stream`)).objectFit).toBe(
				objectFit
			)
		}
	)

	it.each([
		{ name: 'both sizes given', widthPx: 640, heightPx: 480, ratio: '640 / 480' },
		{ name: 'no sizes', widthPx: undefined, heightPx: undefined, ratio: '16 / 9' },
		{ name: 'a width of 0', widthPx: 0, heightPx: 480, ratio: '16 / 9' },
		{ name: 'a negative height', widthPx: 640, heightPx: -480, ratio: '16 / 9' },
		{ name: 'a width that is not a number', widthPx: Number.NaN, heightPx: 480, ratio: '16 / 9' },
		{ name: 'only a width', widthPx: 640, heightPx: undefined, ratio: '16 / 9' },
	])(
		'holds the feed at $ratio before the first frame given $name',
		({ widthPx, heightPx, ratio }) => {
			render(Subject, { props: { partID, resourceName, widthPx, heightPx } })

			expect(mediaBoxAspectRatio(screen.getByRole('button', { name: 'Start feed' }))).toBe(ratio)
		}
	)

	it('seeds the image fit from defaultFit', () => {
		render(Subject, { props: { partID, resourceName, defaultFit: 'crop' } })

		expect(groupFor('Image').getByRole('combobox', { name: 'Fit' })).toHaveTextContent(
			'Crop to fill'
		)
	})

	it('opens on Keep ratio with no defaultFit', () => {
		render(Subject, { props: { partID, resourceName } })

		expect(groupFor('Image').getByRole('combobox', { name: 'Fit' })).toHaveTextContent('Keep ratio')
	})

	it('ignores a defaultFit from config that is not a fit', () => {
		const defaultFit: MediaFit = JSON.parse('"zoom"')

		render(Subject, { props: { partID, resourceName, defaultFit } })

		expect(groupFor('Image').getByRole('combobox', { name: 'Fit' })).toHaveTextContent('Keep ratio')
	})

	it('hides Add to dataset when the app provides no dataset context', () => {
		render(Subject, { props: { partID, resourceName, autoplay: true } })

		expect(screen.queryByRole('button', { name: 'Add to dataset' })).not.toBeInTheDocument()
	})

	it("adds the selected source's own image to the dataset as a getImages capture", async () => {
		state.images = [
			{ sourceName: 'color', mimeType: 'image/jpeg', image: new Uint8Array([1, 2, 3]) },
			{ sourceName: 'depth', mimeType: 'image/png', image: new Uint8Array([4, 5]) },
		]
		const onAddImage = vi.fn()
		render(Subject, { props: { partID, resourceName, autoplay: true, onAddImage } })
		await userEvent.click(screen.getByRole('combobox', { name: 'Source' }))
		await userEvent.click(await screen.findByRole('option', { name: 'depth' }))
		await userEvent.click(screen.getByRole('button', { name: 'Add to dataset' }))
		const confirm = await screen.findByRole('button', { name: 'Add' })
		await expect.poll(() => confirm.hasAttribute('disabled')).toBe(false)

		await userEvent.click(confirm)

		expect(onAddImage).toHaveBeenCalledWith(
			expect.objectContaining({
				binaryData: new Uint8Array([4, 5]),
				mimeType: 'image/png',
				componentName: resourceName,
				methodName: 'getImages',
			})
		)
	})
})

describe('Camera LiveFeed in a 320 px pane', () => {
	beforeEach(() => {
		localStorage.clear()
		state.imagesError = null
		state.properties = undefined
		state.pointcloudError = null
		state.pointcloudIsLoading = false
	})

	it('fits the widget root and the pane within 320 px', () => {
		render(PaneSubject, { props: { widget: CameraControls } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})

	it("sizes the video to its container's width as the container resizes", async () => {
		render(PaneSubject, { props: { widget: CameraControls } })
		const pane = screen.getByTestId('pane')
		const video = screen.getByLabelText(`${resourceName} stream`)

		expect(video.getBoundingClientRect().width).toBe(320)

		pane.style.width = '480px'

		await expect.poll(() => video.getBoundingClientRect().width).toBe(480)
	})
})
