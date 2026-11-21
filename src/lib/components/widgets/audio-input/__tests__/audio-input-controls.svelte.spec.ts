import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../audio-input-controls.svelte'
import Pane from './__fixtures__/audio-input-controls-in-320-pane.svelte'
import WidePane from './__fixtures__/audio-input-controls-in-672-pane.svelte'

interface FakeChunk {
	audioData: Uint8Array
	audioInfo: { codec: string; sampleRateHz: number; numChannels: number }
}

interface AudioRequest {
	codec: string
	durationSeconds: number
	signal: AbortSignal
}

class ChunkFeed {
	readonly requests: AudioRequest[] = []
	#pending: FakeChunk[] = []
	#wake: (() => void) | undefined

	push(...chunks: FakeChunk[]) {
		this.#pending.push(...chunks)
		this.#wake?.()
	}

	async *stream(request: AudioRequest) {
		this.requests.push(request)
		while (!request.signal.aborted) {
			const next = this.#pending.shift()
			if (next) {
				yield next
				continue
			}
			await new Promise<void>((resolve) => {
				this.#wake = resolve
				request.signal.addEventListener('abort', () => resolve(), { once: true })
			})
		}
	}
}

interface ScheduledBuffer {
	startTime: number
	channels: number[][]
}

class FakeAudioContext {
	static readonly instances: FakeAudioContext[] = []
	readonly currentTime = 0
	readonly destination = {}
	readonly scheduled: ScheduledBuffer[] = []
	isClosed = false

	constructor() {
		FakeAudioContext.instances.push(this)
	}

	createBuffer(numberOfChannels: number, length: number, sampleRate: number) {
		return new AudioBuffer({ numberOfChannels, length, sampleRate })
	}

	createBufferSource() {
		let buffer: AudioBuffer | null = null
		return {
			set buffer(next: AudioBuffer | null) {
				buffer = next
			},
			connect: () => undefined,
			start: (startTime: number) => {
				const played = buffer
				if (played === null) throw new Error('A source started with no buffer')
				this.scheduled.push({
					startTime,
					channels: Array.from({ length: played.numberOfChannels }, (_, channel) => [
						...played.getChannelData(channel),
					]),
				})
			},
		}
	}

	close() {
		this.isClosed = true
		return Promise.resolve()
	}
}

const state = vi.hoisted(
	(): {
		feed: { stream: (request: AudioRequest) => AsyncIterable<unknown> } | undefined
		properties: { supportedCodecs: string[]; sampleRateHz: number; numChannels: number }
	} => ({
		feed: undefined,
		properties: { supportedCodecs: [], sampleRateHz: 8000, numChannels: 2 },
	})
)

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({
			current: {
				callOptions: {},
				getAudio: (
					codec: string,
					durationSeconds: number,
					_previousTimestamp: bigint,
					_extra: object,
					callOptions: { signal: AbortSignal }
				) => {
					if (!state.feed) throw new Error('No chunk feed')
					return state.feed.stream({ codec, durationSeconds, signal: callOptions.signal })
				},
			},
		})),
		createResourceQuery: vi.fn(() => ({
			get data() {
				return state.properties
			},
			isLoading: false,
			isSuccess: true,
			isError: false,
			fetchStatus: 'idle',
			error: null,
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const PROPS = { partID: 'test-part', resourceName: 'test-audio-in' }
const SAMPLE_RATE_HZ = 8000

const pcm16Chunk = (bytes: number[] | Uint8Array, numChannels: number): FakeChunk => ({
	audioData: new Uint8Array(bytes),
	audioInfo: { codec: 'pcm16', sampleRateHz: SAMPLE_RATE_HZ, numChannels },
})

const halfSecondOfMonoSilence = () => pcm16Chunk(new Uint8Array(SAMPLE_RATE_HZ), 1)

const STEREO_FRAMES = [0x00, 0x40, 0x00, 0xe0, 0x00, 0xa0, 0x00, 0x10]

let feed: ChunkFeed
let user: ReturnType<typeof userEvent.setup>

beforeEach(() => {
	feed = new ChunkFeed()
	state.feed = feed
	state.properties = { supportedCodecs: ['pcm16'], sampleRateHz: SAMPLE_RATE_HZ, numChannels: 2 }
	FakeAudioContext.instances.length = 0
	vi.stubGlobal('AudioContext', FakeAudioContext)
	user = userEvent.setup()
})

afterEach(() => {
	state.feed = undefined
})

const renderSubject = () => render(Subject, { props: PROPS })

const listenButton = () => screen.getByRole('button', { name: 'Listen' })
const recordButton = () => screen.getByRole('button', { name: 'Record' })
const downloadButton = () => screen.getByRole('button', { name: 'Download' })

const startListening = async () => {
	const rendered = renderSubject()
	await user.click(listenButton())
	await vi.waitFor(() => expect(feed.requests).toHaveLength(1))
	return rendered
}

const recordTwoHalfSeconds = async () => {
	await startListening()
	feed.push(halfSecondOfMonoSilence())
	await vi.waitFor(() => expect(FakeAudioContext.instances[0]?.scheduled).toHaveLength(1))
	await user.click(recordButton())
	feed.push(halfSecondOfMonoSilence(), halfSecondOfMonoSilence())
	await vi.waitFor(() => expect(FakeAudioContext.instances[0]?.scheduled).toHaveLength(3))
}

describe('AudioInputControls', () => {
	it('creates no AudioContext and requests no audio before Listen is pressed', () => {
		renderSubject()

		expect(FakeAudioContext.instances).toHaveLength(0)
		expect(feed.requests).toHaveLength(0)
	})

	it('streams GetAudio at duration 0 with pcm16 when Listen is pressed', async () => {
		renderSubject()

		await user.click(listenButton())

		await vi.waitFor(() =>
			expect(
				feed.requests.map(({ codec, durationSeconds }) => ({ codec, durationSeconds }))
			).toEqual([{ codec: 'pcm16', durationSeconds: 0 }])
		)
		expect(listenButton()).toHaveAttribute('aria-pressed', 'true')
	})

	it('plays each chunk by its own audio info, scheduled where the last one ends', async () => {
		await startListening()

		feed.push(pcm16Chunk(STEREO_FRAMES, 2), pcm16Chunk(STEREO_FRAMES.slice(0, 4), 1))

		await vi.waitFor(() =>
			expect(FakeAudioContext.instances[0]?.scheduled).toEqual([
				{
					startTime: 0,
					channels: [
						[0.5, -0.75],
						[-0.25, 0.125],
					],
				},
				{ startTime: 0.00025, channels: [[0.5, -0.25]] },
			])
		)
	})

	it("shows each channel's peak in the latest chunk as its level", async () => {
		await startListening()

		feed.push(pcm16Chunk(STEREO_FRAMES, 2))

		await vi.waitFor(() =>
			expect(
				screen
					.getAllByRole('progressbar')
					.map((meter) => [meter.getAttribute('aria-label'), meter.getAttribute('aria-valuenow')])
			).toEqual([
				['Channel 1 level', '75'],
				['Channel 2 level', '25'],
			])
		)
	})

	it("draws GetProperties' channel count at level 0 while idle", () => {
		state.properties = { supportedCodecs: ['pcm16'], sampleRateHz: SAMPLE_RATE_HZ, numChannels: 3 }

		renderSubject()

		const level = screen.getByRole('group', { name: 'Level' })
		expect(
			within(level)
				.getAllByRole('progressbar')
				.map((meter) => meter.getAttribute('aria-valuenow'))
		).toEqual(['0', '0', '0'])
	})

	it('locks Codec while listening', async () => {
		await startListening()

		expect(screen.getByRole('combobox', { name: 'Codec' })).toBeDisabled()
	})

	it('keeps Record disabled until Listen is pressed', () => {
		renderSubject()

		expect(recordButton()).toBeDisabled()
	})

	it('keeps Record disabled while listening until a chunk is heard', async () => {
		await startListening()

		expect(recordButton()).toBeDisabled()
	})

	it('enables Record once a chunk is heard', async () => {
		await startListening()

		feed.push(halfSecondOfMonoSilence())

		await vi.waitFor(() => expect(recordButton()).toBeEnabled())
	})

	it('disables Record again when Listen stops', async () => {
		await startListening()
		feed.push(halfSecondOfMonoSilence())
		await vi.waitFor(() => expect(recordButton()).toBeEnabled())

		await user.click(listenButton())

		expect(recordButton()).toBeDisabled()
	})

	it('heads the section Controls and not GetAudio', () => {
		renderSubject()

		expect(screen.getByText('Controls')).toBeInTheDocument()
		expect(screen.queryByText('GetAudio')).not.toBeInTheDocument()
	})

	it('keeps Record disabled after a chunk that does not decode', async () => {
		await startListening()

		feed.push(pcm16Chunk([0x00, 0x40, 0x00], 1))

		await vi.waitFor(() => expect(listenButton()).toHaveAttribute('aria-pressed', 'false'))
		expect(recordButton()).toBeDisabled()
	})

	it('stops Listen on a second press before the first chunk is heard, after one GetAudio call', async () => {
		renderSubject()

		await user.click(listenButton())
		await user.click(listenButton())

		await vi.waitFor(() => expect(feed.requests).toHaveLength(1))
		expect(listenButton()).toHaveAttribute('aria-pressed', 'false')
	})

	it('counts only what is heard while Record is pressed, in KB and seconds', async () => {
		await recordTwoHalfSeconds()

		const recording = screen.getByRole('group', { name: 'Recording' })
		expect(recording).toHaveTextContent('Recording Recorded 15.6 KB Elapsed 1.0 s')
	})

	it('keeps Download disabled while Record is pressed', async () => {
		await recordTwoHalfSeconds()

		expect(downloadButton()).toBeDisabled()
	})

	it('downloads the recorded bytes as audio-recording.pcm16 once Record is released', async () => {
		const downloads: { name: string; href: string }[] = []
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
			this: HTMLAnchorElement
		) {
			downloads.push({ name: this.download, href: this.href })
		})
		await recordTwoHalfSeconds()
		await user.click(recordButton())

		await user.click(downloadButton())

		expect(downloads.map(({ name }) => name)).toEqual(['audio-recording.pcm16'])
		const response = await fetch(downloads[0]?.href ?? '')
		const blob = await response.blob()
		expect(blob.size, 'two half seconds of mono int16 at 8000 Hz').toBe(16_000)
	})

	it('lists playable codecs first with pcm16 first, and the rest disabled under Cannot play here', async () => {
		state.properties = {
			supportedCodecs: ['opus', 'pcm32', 'pcm16', 'mp3'],
			sampleRateHz: SAMPLE_RATE_HZ,
			numChannels: 1,
		}
		renderSubject()

		await user.click(screen.getByRole('combobox', { name: 'Codec' }))

		const options = await screen.findAllByRole('option')
		expect(
			options.map((option) => [option.textContent.trim(), option.getAttribute('aria-disabled')])
		).toEqual([
			['pcm16', null],
			['pcm32', null],
			['opus', 'true'],
			['mp3', 'true'],
		])
		expect(screen.getByText('Cannot play here')).toBeInTheDocument()
	})

	it('reports a chunk that does not decode in the section indicator', async () => {
		await startListening()

		feed.push(pcm16Chunk([0x00, 0x40, 0x00], 1))

		expect(
			await screen.findByRole('button', { name: '1 error, copy to clipboard' })
		).toBeInTheDocument()
	})

	it('stops listening when a chunk does not decode', async () => {
		await startListening()

		feed.push(pcm16Chunk([0x00, 0x40, 0x00], 1))

		await vi.waitFor(() => expect(listenButton()).toHaveAttribute('aria-pressed', 'false'))
		expect(feed.requests[0]?.signal.aborted, 'the stream is cancelled').toBe(true)
		expect(FakeAudioContext.instances[0]?.isClosed, 'the context is closed').toBe(true)
	})

	it('aborts the stream and closes the context on unmount', async () => {
		const { unmount } = await startListening()

		unmount()

		expect(feed.requests[0]?.signal.aborted, 'the stream is cancelled').toBe(true)
		expect(FakeAudioContext.instances[0]?.isClosed, 'the context is closed').toBe(true)
	})

	it('keeps the root and the pane within 320 px', async () => {
		render(Pane, { props: { widget: Subject } })
		await user.click(listenButton())
		feed.push(pcm16Chunk(STEREO_FRAMES, 2))
		await vi.waitFor(() => expect(FakeAudioContext.instances[0]?.scheduled).toHaveLength(1))
		await user.click(recordButton())

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? pane
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})

	it('puts the channel levels in a second column beside the controls in a 672 px pane', () => {
		render(WidePane, { props: { widget: Subject } })

		const controls = screen.getByRole('combobox', { name: 'Codec' }).getBoundingClientRect()
		const levels = screen.getByRole('group', { name: 'Level' }).getBoundingClientRect()

		expect(levels.left, 'levels start right of the controls column').toBeGreaterThanOrEqual(
			controls.right
		)
		expect(levels.top, 'levels start at the top of the controls').toBeLessThan(controls.bottom)
	})

	it('stacks the channel levels below the controls in a 320 px pane', () => {
		render(Pane, { props: { widget: Subject } })

		const controls = listenButton().getBoundingClientRect()
		const levels = screen.getByRole('group', { name: 'Level' }).getBoundingClientRect()

		expect(levels.top, 'levels start below the controls').toBeGreaterThanOrEqual(controls.bottom)
	})
})
