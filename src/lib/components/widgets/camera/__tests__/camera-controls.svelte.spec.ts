import { fireEvent, render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { MachineConnectionEvent } from '@viamrobotics/sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RefetchRates } from '$lib/components/refetch-interval-store.svelte'

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
		pointcloudError: Error | null
		pointcloudIsLoading: boolean
		pointcloudOptions: (() => MockQueryOptions) | undefined
	} => ({
		images: undefined,
		imagesError: null,
		properties: undefined,
		pointcloudError: null,
		pointcloudIsLoading: false,
		pointcloudOptions: undefined,
	})
)

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
	useRobotClient: vi.fn(() => ({ current: undefined })),
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
				() => state.pointcloudIsLoading
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

const sectionFor = (method: string) => {
	const section = screen.getByRole('heading', { name: method }).closest('section')
	if (!section) throw new Error(`No section for ${method}`)
	return within(section)
}

const groupFor = (method: string) => within(screen.getByRole('group', { name: method }))

const startsAutomatically = (method: string) =>
	groupFor(method).getByRole('checkbox', { name: 'Start feed automatically' })

const pointCloudOptions = (): MockQueryOptions => {
	if (!state.pointcloudOptions) throw new Error('GetPointCloud was never queried')
	return state.pointcloudOptions()
}

const renderInPointCloudMode = async () => {
	state.properties = { supportsPcd: true }
	render(Subject, { props: { partID, resourceName } })
	await userEvent.click(screen.getByRole('radio', { name: 'Point cloud' }))
}

describe('CameraControls', () => {
	beforeEach(() => {
		localStorage.setItem(waitToStartFeedKey, 'true')
		state.images = undefined
		state.imagesError = null
		state.properties = undefined
		state.pointcloudError = null
		state.pointcloudIsLoading = false
		state.pointcloudOptions = undefined
	})

	afterEach(() => {
		localStorage.removeItem(waitToStartFeedKey)
		localStorage.removeItem(waitToStartPointCloudKey)
		localStorage.removeItem(pointCloudRateKey)
	})

	it('waits for the user to start the feed when the saved preference is off', () => {
		render(Subject, { props: { partID, resourceName } })

		expect(screen.getByRole('button', { name: 'Start feed' })).toBeInTheDocument()
		expect(startsAutomatically('GetImages')).not.toBeChecked()
	})

	it('starts the feed on mount with autoplay while leaving the saved preference off', () => {
		render(Subject, { props: { partID, resourceName, autoplay: true } })

		expect(screen.queryByRole('button', { name: 'Start feed' })).not.toBeInTheDocument()
		expect(startsAutomatically('GetImages')).not.toBeChecked()
		expect(localStorage.getItem(waitToStartFeedKey)).toBe('true')
	})

	it('saves a checked Start feed automatically as no longer waiting', async () => {
		render(Subject, { props: { partID, resourceName } })

		await userEvent.click(startsAutomatically('GetImages'))

		expect(startsAutomatically('GetImages')).toBeChecked()
		expect(localStorage.getItem(waitToStartFeedKey)).toBe('false')
		expect(screen.queryByRole('button', { name: 'Start feed' })).not.toBeInTheDocument()
	})

	it('shows no Mode toggle before GetProperties answers', () => {
		render(Subject, { props: { partID, resourceName } })

		expect(screen.queryByRole('radio', { name: 'Point cloud' })).not.toBeInTheDocument()
		expect(screen.getByRole('group', { name: 'GetImages' })).toBeInTheDocument()
	})

	it('shows no Mode toggle when GetProperties reports no point cloud support', () => {
		state.properties = { supportsPcd: false }

		render(Subject, { props: { partID, resourceName } })

		expect(screen.queryByRole('radio', { name: 'Point cloud' })).not.toBeInTheDocument()
		expect(screen.getByRole('group', { name: 'GetImages' })).toBeInTheDocument()
	})

	it('opens on Image mode when GetProperties reports point cloud support', () => {
		state.properties = { supportsPcd: true }

		render(Subject, { props: { partID, resourceName } })

		expect(screen.getByRole('radio', { name: 'Image' })).toBeChecked()
		expect(screen.getByRole('group', { name: 'GetImages' })).toBeInTheDocument()
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
		expect(startsAutomatically('GetPointCloud')).not.toBeChecked()
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
		expect(startsAutomatically('GetPointCloud')).not.toBeChecked()
	})

	it('starts the point cloud from its checkbox and saves it as no longer waiting', async () => {
		await renderInPointCloudMode()

		await userEvent.click(startsAutomatically('GetPointCloud'))

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

		await userEvent.click(groupFor('GetImages').getByRole('combobox', { name: 'Refresh rate' }))

		expect(await screen.findByRole('option', { name: RefetchRates.LIVE })).toBeInTheDocument()
	})

	it('offers no Live on the point cloud refresh row', async () => {
		await renderInPointCloudMode()

		await userEvent.click(groupFor('GetPointCloud').getByRole('combobox', { name: 'Refresh rate' }))
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
			groupFor('GetImages').getByRole('checkbox', { name: 'Mouse position tooltip' })
		).not.toBeChecked()
	})

	it("shows the point cloud error in the GetPointCloud section's indicator", async () => {
		state.pointcloudError = new Error('no depth sensor')
		await renderInPointCloudMode()

		await userEvent.click(screen.getByRole('button', { name: 'Start point cloud' }))

		expect(
			sectionFor('GetPointCloud').getByRole('button', { name: '1 error, copy to clipboard' })
		).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Copy error' })).not.toBeInTheDocument()
	})

	it('shows a progress bar while the point cloud loads', async () => {
		state.pointcloudIsLoading = true
		await renderInPointCloudMode()

		await userEvent.click(screen.getByRole('button', { name: 'Start point cloud' }))

		expect(sectionFor('GetPointCloud').getByRole('progressbar')).toBeInTheDocument()
	})

	it('disables the feed actions until the feed starts', () => {
		render(Subject, { props: { partID, resourceName } })

		expect(screen.getByRole('button', { name: 'Screenshot' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Picture-in-picture' })).toBeDisabled()
	})

	it("shows a failed screenshot export in the GetImages section's indicator", async () => {
		render(Subject, { props: { partID, resourceName, autoplay: true } })
		state.imagesError = new Error('export failed')

		await userEvent.click(screen.getByRole('button', { name: /screenshot/iu }))

		expect(
			await sectionFor('GetImages').findByRole('button', { name: '1 error, copy to clipboard' })
		).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Copy error' })).not.toBeInTheDocument()
	})

	it("shows a refused picture-in-picture request in the GetImages section's indicator", async () => {
		vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(
			HTMLMediaElement.HAVE_METADATA
		)
		vi.spyOn(HTMLVideoElement.prototype, 'requestPictureInPicture').mockRejectedValue(
			new Error('pip denied')
		)
		render(Subject, { props: { partID, resourceName, autoplay: true } })

		await userEvent.click(screen.getByRole('button', { name: /picture-in-picture/iu }))

		const indicator = await sectionFor('GetImages').findByRole('button', {
			name: '1 error, copy to clipboard',
		})
		await fireEvent.focusIn(indicator)
		expect(screen.getByText('Error: pip denied')).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Copy error' })).not.toBeInTheDocument()
	})

	it('keeps the feed error on the video overlay instead of the GetImages indicator', async () => {
		state.imagesError = new Error('camera offline')
		render(Subject, { props: { partID, resourceName, autoplay: true } })

		expect(await screen.findByText('Error: camera offline')).toBeInTheDocument()
		expect(sectionFor('GetImages').getByRole('button', { name: 'No errors' })).toBeInTheDocument()
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

describe('CameraControls in a 320 px pane', () => {
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
