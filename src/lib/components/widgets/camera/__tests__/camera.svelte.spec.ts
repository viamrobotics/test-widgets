import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { MachineConnectionEvent } from '@viamrobotics/sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from './camera.spec.svelte'

interface MockQuery {
	data: undefined
	isLoading: boolean
	isError: boolean
	error: Error | null
	fetchStatus: 'idle' | 'fetching'
	refetch: () => Promise<{ error: Error | null; data: undefined }>
}

const state = vi.hoisted(
	(): {
		imagesError: Error | null
		pointcloudError: Error | null
		pointcloudIsLoading: boolean
	} => ({
		imagesError: null,
		pointcloudError: null,
		pointcloudIsLoading: false,
	})
)

const createMockQuery = (getError: () => Error | null, getIsLoading = () => false): MockQuery => ({
	data: undefined,
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
	refetch: () => Promise.resolve({ error: getError(), data: undefined }),
})

vi.mock('@viamrobotics/svelte-sdk', () => ({
	useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	useRobotClient: vi.fn(() => ({ current: undefined })),
	createResourceClient: vi.fn(() => ({ current: undefined })),
	createResourceQuery: vi.fn((_client: unknown, method: string) =>
		method === 'getPointCloud'
			? createMockQuery(
					() => state.pointcloudError,
					() => state.pointcloudIsLoading
				)
			: createMockQuery(() => state.imagesError)
	),
	createStreamClient: vi.fn(),
}))

const partID = 'test-part'
const resourceName = 'test-camera'
const waitToStartFeedKey = `camera-wait-to-start-feed/${partID}/${resourceName}`

const sectionFor = (method: string) => {
	const section = screen.getByRole('heading', { name: method }).closest('section')
	if (!section) throw new Error(`No section for ${method}`)
	return within(section)
}

describe('Camera widget', () => {
	beforeEach(() => {
		localStorage.setItem(waitToStartFeedKey, 'true')
		state.imagesError = null
		state.pointcloudError = null
		state.pointcloudIsLoading = false
	})

	afterEach(() => {
		localStorage.removeItem(waitToStartFeedKey)
	})

	it('waits for the user to start the feed when the saved preference is off', () => {
		render(Subject, { props: { partID, resourceName } })

		expect(screen.getByRole('button', { name: /start feed/iu })).toBeInTheDocument()
	})

	it('starts the feed on mount with autoplay while leaving the saved preference off', () => {
		render(Subject, { props: { partID, resourceName, autoplay: true } })

		expect(screen.queryByRole('button', { name: /start feed/iu })).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'No', pressed: true })).toBeInTheDocument()
		expect(localStorage.getItem(waitToStartFeedKey)).toBe('true')
	})

	it("shows the point cloud error in the GetPointCloud section's indicator", async () => {
		state.pointcloudError = new Error('no depth sensor')
		render(Subject, { props: { partID, resourceName } })

		await userEvent.click(sectionFor('GetPointCloud').getByRole('switch'))

		expect(
			sectionFor('GetPointCloud').getByRole('button', { name: '1 error, copy to clipboard' })
		).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Copy error' })).not.toBeInTheDocument()
	})

	it('shows a progress bar while the point cloud loads', async () => {
		state.pointcloudIsLoading = true
		render(Subject, { props: { partID, resourceName } })

		await userEvent.click(sectionFor('GetPointCloud').getByRole('switch'))

		expect(sectionFor('GetPointCloud').getByRole('progressbar')).toBeInTheDocument()
	})

	it("shows a failed screenshot export in the GetImages section's indicator", async () => {
		render(Subject, { props: { partID, resourceName } })
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
		render(Subject, { props: { partID, resourceName } })

		await userEvent.click(screen.getByRole('button', { name: /picture-in-picture/iu }))

		expect(
			await sectionFor('GetImages').findByRole('button', { name: '1 error, copy to clipboard' })
		).toBeInTheDocument()
		expect(sectionFor('GetImages').getByText('Error: pip denied')).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Copy error' })).not.toBeInTheDocument()
	})

	it('keeps the feed error on the video overlay instead of the GetImages indicator', async () => {
		state.imagesError = new Error('camera offline')
		render(Subject, { props: { partID, resourceName, autoplay: true } })

		expect(await screen.findByText('Error: camera offline')).toBeInTheDocument()
		expect(sectionFor('GetImages').getByRole('button', { name: 'No errors' })).toBeInTheDocument()
	})
})
