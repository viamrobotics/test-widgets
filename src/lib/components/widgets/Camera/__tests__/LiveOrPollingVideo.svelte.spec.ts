import { fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from './LiveOrPollingVideo.spec.svelte'

type TrackHandler = (event: { streams: MediaStream[] }) => void

const stream = vi.hoisted(() => {
	const state: {
		getStream: Mock<(name: string) => void>
		remove: Mock<(name: string) => void>
		makeTrack: (name: string) => MediaStream | undefined
		failure: Error | undefined
	} = {
		getStream: vi.fn<(name: string) => void>(),
		remove: vi.fn<(name: string) => void>(),
		makeTrack: () => undefined,
		failure: undefined,
	}
	return state
})

vi.mock('@viamrobotics/sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/sdk')>()),
	StreamClient: class {
		private handler: TrackHandler | undefined

		on(_event: 'track', handler: TrackHandler) {
			this.handler = handler
		}

		off() {
			this.handler = undefined
		}

		async getStream(name: string) {
			stream.getStream(name)
			if (stream.failure) throw stream.failure
			const track = stream.makeTrack(name)
			if (track) this.handler?.({ streams: [track] })
			return
		}

		async getOptions() {
			return []
		}

		async remove(name: string) {
			stream.remove(name)
			return
		}
	},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	useRobotClient: vi.fn(() => ({ current: {} })),
	createResourceClient: vi.fn(() => ({ current: undefined })),
	createResourceQuery: vi.fn(),
	createStreamClient: vi.fn(),
}))

const partID = 'test-part'
const resourceName = 'test-camera'

const topOffsetFromVideo = (element: HTMLElement) =>
	element.getBoundingClientRect().top -
	screen.getByLabelText(`${resourceName} stream`).getBoundingClientRect().top

// A MediaStream's id is random and read-only, and the component matches tracks to its resource by that id.
const streamNamed = (name: string) => {
	const mediaStream = new MediaStream()
	Object.defineProperty(mediaStream, 'id', { value: name })
	return mediaStream
}

const pngOfSize = async (width: number, height: number) => {
	const canvas = new OffscreenCanvas(width, height)
	canvas.getContext('2d')?.fillRect(0, 0, width, height)
	const blob = await canvas.convertToBlob({ type: 'image/png' })
	return new Uint8Array(await blob.arrayBuffer())
}

afterEach(() => {
	stream.getStream.mockClear()
	stream.remove.mockClear()
	stream.makeTrack = () => undefined
	stream.failure = undefined
})

describe('LiveOrPollingVideo', () => {
	it('Live video resumes when its pane is shown again', async () => {
		const tracks: MediaStream[] = []
		stream.makeTrack = (name) => {
			const track = streamNamed(name)
			tracks.push(track)
			return track
		}

		const first = render(Subject, { props: { partID, resourceName, isLive: true } })
		await vi.waitFor(() => {
			expect(screen.getByLabelText<HTMLVideoElement>(`${resourceName} stream`).srcObject).toBe(
				tracks[0]
			)
		})

		first.unmount()
		await vi.waitFor(() => {
			expect(stream.remove).toHaveBeenCalledWith(resourceName)
		})

		render(Subject, { props: { partID, resourceName, isLive: true } })

		await vi.waitFor(() => {
			expect(stream.getStream).toHaveBeenCalledTimes(2)
		})
		expect(stream.getStream).toHaveBeenLastCalledWith(resourceName)
		await vi.waitFor(() => {
			expect(screen.getByLabelText<HTMLVideoElement>(`${resourceName} stream`).srcObject).toBe(
				tracks[1]
			)
		})
	})

	it('keeps the error overlay on the video when its scroll container scrolls', async () => {
		render(Subject, {
			props: { partID, resourceName, error: new Error('no node found') },
		})
		const errorText = await screen.findByText('Error: no node found')
		const offsetBeforeScroll = topOffsetFromVideo(errorText)

		screen.getByTestId('scroller').scrollTop = 120

		expect(topOffsetFromVideo(errorText)).toBe(offsetBeforeScroll)
	})

	it('sizes the error overlay to the video it covers', async () => {
		render(Subject, {
			props: { partID, resourceName, error: new Error('no node found') },
		})
		const errorText = await screen.findByText('Error: no node found')
		const overlay = errorText.closest<HTMLElement>('.absolute')
		if (!overlay) throw new Error('No overlay around the error text')
		const video = screen.getByLabelText(`${resourceName} stream`).getBoundingClientRect()

		await expect.poll(() => overlay.getBoundingClientRect().height).toBe(video.height)
		expect(overlay.getBoundingClientRect().width).toBe(video.width)
	})

	it('sends a failed poll to onPollingError instead of drawing it over the video', async () => {
		const onPollingError = vi.fn<(error: Error | undefined) => void>()
		const error = new Error('deadline exceeded')

		render(Subject, { props: { partID, resourceName, error, onPollingError } })

		await vi.waitFor(() => {
			expect(onPollingError).toHaveBeenLastCalledWith(error)
		})
		expect(screen.queryByText('Error: deadline exceeded')).not.toBeInTheDocument()
	})

	it('keeps the stream on the video after a reported poll fails, so the last good frame stays', async () => {
		render(Subject, {
			props: {
				partID,
				resourceName,
				error: new Error('deadline exceeded'),
				onPollingError: vi.fn(),
			},
		})

		await expect
			.poll(() => screen.getByLabelText<HTMLVideoElement>(`${resourceName} stream`).srcObject)
			.toBeInstanceOf(MediaStream)
	})

	it('reports the source pixel under the cursor through a cropping object-fit', async () => {
		const image = await pngOfSize(200, 100)
		render(Subject, {
			props: {
				partID,
				resourceName,
				images: [{ sourceName: 'color', mimeType: 'image/png', image }],
				boxClass: 'size-100',
				fit: 'crop',
				showMousePositionTooltip: true,
			},
		})
		const video = screen.getByLabelText<HTMLVideoElement>(`${resourceName} stream`)
		await expect.poll(() => video.getBoundingClientRect().width).toBe(400)
		const box = video.getBoundingClientRect()

		await expect
			.poll(
				async () => {
					await fireEvent.mouseEnter(video)
					await fireEvent.mouseMove(video, { clientX: box.left + 100, clientY: box.top + 150 })
					return screen.queryByRole('tooltip')?.textContent?.replaceAll(/\s+/gu, ' ').trim()
				},
				{
					message:
						'a 200 x 100 frame covering a 400 x 400 box draws at 4x, 200 px cut off each side',
				}
			)
			.toBe('75x38 (37.5%x37.5%)')
	})

	it('sends a dropped Live stream to onStreamError instead of drawing it over the video', async () => {
		const onStreamError = vi.fn<(error: Error) => void>()
		const failure = new Error('stream dropped')
		stream.failure = failure

		render(Subject, { props: { partID, resourceName, isLive: true, onStreamError } })

		await vi.waitFor(() => {
			expect(onStreamError).toHaveBeenLastCalledWith(failure)
		})
		expect(screen.queryByText('Error: stream dropped')).not.toBeInTheDocument()
	})

	it('draws a dropped Live stream over the video for a host that takes no stream errors', async () => {
		stream.failure = new Error('stream dropped')

		render(Subject, { props: { partID, resourceName, isLive: true } })

		expect(await screen.findByText('Error: stream dropped')).toBeInTheDocument()
	})
})
