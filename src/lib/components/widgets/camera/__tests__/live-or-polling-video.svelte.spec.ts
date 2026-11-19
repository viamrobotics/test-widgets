import { render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Subject from './live-or-polling-video.spec.svelte'

type TrackHandler = (event: { streams: MediaStream[] }) => void

const stream = vi.hoisted(() => {
	const makeTrack: (name: string) => MediaStream | undefined = () => undefined
	return {
		getStream: vi.fn<(name: string) => void>(),
		remove: vi.fn<(name: string) => void>(),
		makeTrack,
	}
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

afterEach(() => {
	stream.getStream.mockClear()
	stream.remove.mockClear()
	stream.makeTrack = () => undefined
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
})
