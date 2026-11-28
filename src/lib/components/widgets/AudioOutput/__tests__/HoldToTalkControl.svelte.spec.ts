import type { AudioOutClient } from '@viamrobotics/sdk'

import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { userEvent as browserUserEvent } from 'vitest/browser'

import Subject from '../HoldToTalkControl.svelte'
import Play from '../PlayWidget.svelte'
import Pane from './__fixtures__/In320Pane.svelte'

interface StreamCall {
	info: Parameters<AudioOutClient['playStream']>[0]
	received: Uint8Array[]
	isEnded: boolean
}

interface ControlsState {
	properties: { supportedCodecs: string[]; sampleRateHz: number; numChannels: number } | undefined
	play: Mock<AudioOutClient['play']>
	playStream: Mock<AudioOutClient['playStream']>
	streamCalls: StreamCall[]
}

const state = vi.hoisted(
	(): ControlsState => ({
		properties: undefined,
		play: vi.fn<AudioOutClient['play']>(),
		playStream: vi.fn<AudioOutClient['playStream']>(),
		streamCalls: [],
	})
)

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({
			current: {
				play: (...args: Parameters<AudioOutClient['play']>) => state.play(...args),
				playStream: (...args: Parameters<AudioOutClient['playStream']>) =>
					state.playStream(...args),
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

const PROPS = { partID: 'test-part', resourceName: 'test-audio-out' }
const DEVICE_SAMPLE_RATE_HZ = 16_000
const HELD_MS = 300
const INT16_HALF_SCALE = 16_384
const FETCH_TRANSPORT_ERROR = '[unknown] The fetch API does not support streaming request bodies'

const RealAudioContext = globalThis.AudioContext
const contexts: AudioContext[] = []
const microphones: MediaStream[] = []

class RecordedAudioContext extends RealAudioContext {
	constructor(options?: AudioContextOptions) {
		super(options)
		contexts.push(this)
	}
}

const openOscillatorMicrophone = () => {
	const context = new RealAudioContext()
	const oscillator = context.createOscillator()
	const destination = context.createMediaStreamDestination()
	oscillator.connect(destination)
	oscillator.start()
	microphones.push(destination.stream)
	return Promise.resolve(destination.stream)
}

const receiveStream = async (
	info: StreamCall['info'],
	chunks: AsyncIterable<Uint8Array>
): Promise<StreamCall> => {
	const call: StreamCall = { info, received: [], isEnded: false }
	state.streamCalls.push(call)
	for await (const chunk of chunks) call.received.push(chunk)
	call.isEnded = true
	return call
}

const collectStream: AudioOutClient['playStream'] = async (info, chunks) => {
	await receiveStream(info, chunks)
}

const collectStreamThenHang: AudioOutClient['playStream'] = async (info, chunks) => {
	await receiveStream(info, chunks)
	await new Promise(() => undefined)
}

const useTransportWithoutClientStreams = () => {
	state.playStream.mockRejectedValue(new Error(FETCH_TRANSPORT_ERROR))
}

const deferred = <TValue>() => {
	let resolve: (value: TValue) => void = () => undefined
	const promise = new Promise<TValue>((settle) => {
		resolve = settle
	})
	return { promise, resolve }
}

const gateStreamReading = () => {
	const reading = deferred<undefined>()
	state.playStream.mockImplementation(async (info, chunks) => {
		await reading.promise
		await receiveStream(info, chunks)
	})
	return reading
}

let getUserMedia: Mock<MediaDevices['getUserMedia']>
let user: ReturnType<typeof userEvent.setup>

const grantUserActivation = async () => {
	await browserUserEvent.click(document.body)
}

beforeEach(async () => {
	await grantUserActivation()
	state.properties = {
		supportedCodecs: ['pcm16', 'wav'],
		sampleRateHz: DEVICE_SAMPLE_RATE_HZ,
		numChannels: 2,
	}
	state.play = vi.fn<AudioOutClient['play']>().mockResolvedValue(undefined)
	state.streamCalls = []
	state.playStream = vi.fn<AudioOutClient['playStream']>(collectStream)
	contexts.length = 0
	microphones.length = 0
	vi.stubGlobal('AudioContext', RecordedAudioContext)
	getUserMedia = vi
		.spyOn(navigator.mediaDevices, 'getUserMedia')
		.mockImplementation(openOscillatorMicrophone)
	user = userEvent.setup()
})

const renderSubject = () =>
	render(InWidgetsProvider, { props: { component: Subject, props: PROPS } })

const renderWithPlay = () =>
	render(InWidgetsProvider, { props: { component: [Subject, Play], props: PROPS } })

const talkButton = () => screen.getByRole('button', { name: 'Hold to talk' })
const playButton = () => screen.getByRole('button', { name: 'Play' })

const waitMs = (ms: number) =>
	new Promise<void>((resolve) => {
		setTimeout(resolve, ms)
	})

const pressTalk = async () => {
	await fireEvent.pointerDown(talkButton(), { button: 0 })
	await vi.waitFor(() => expect(microphones).toHaveLength(1))
}

const holdUntilHeard = async () => {
	await pressTalk()
	await waitMs(HELD_MS)
}

const streamCall = () => {
	const [call] = state.streamCalls
	if (call === undefined) throw new Error('PlayStream was not called')
	return call
}

const streamedBytes = (call: StreamCall) => {
	const total = call.received.reduce((sum, chunk) => sum + chunk.byteLength, 0)
	const bytes = new Uint8Array(total)
	let offset = 0
	for (const chunk of call.received) {
		bytes.set(chunk, offset)
		offset += chunk.byteLength
	}
	return bytes
}

const pressTalkAfterFallback = async () => {
	await fireEvent.pointerDown(talkButton(), { button: 0 })
	await vi.waitFor(() =>
		expect(microphones, 'the stream microphone, then the recording one').toHaveLength(2)
	)
}

const holdUntilHeardAfterFallback = async () => {
	await pressTalkAfterFallback()
	await waitMs(HELD_MS)
}

const talkOnceWithoutClientStreams = async () => {
	useTransportWithoutClientStreams()
	await holdUntilHeardAfterFallback()
	await fireEvent.pointerUp(talkButton())
	await vi.waitFor(() => expect(state.play).toHaveBeenCalledTimes(1))
	microphones.length = 0
}

const microphoneTrackStates = () =>
	microphones.flatMap((stream) => stream.getTracks().map((track) => track.readyState))

const clipPeak = (bytes: Uint8Array) => {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
	let peak = 0
	for (let offset = 0; offset < bytes.byteLength; offset += 2) {
		peak = Math.max(peak, Math.abs(view.getInt16(offset, true)))
	}
	return peak
}

const sentClip = () => {
	const [call] = state.play.mock.calls
	if (call === undefined) throw new Error('Play was not called')
	const [audioData, info] = call
	return { audioData, info }
}

const chooseFile = async (file: File) => {
	const input = screen.getByLabelText('Audio file')
	if (!(input instanceof HTMLInputElement)) throw new Error('The file field has no input')
	const transfer = new DataTransfer()
	transfer.items.add(file)
	input.files = transfer.files
	await fireEvent.change(input)
}

const WAV_BYTES = new Uint8Array([1, 2, 3, 4])
const wavFile = () => new File([WAV_BYTES], 'greeting.wav', { type: 'audio/wav' })

describe('AudioOutput.HoldToTalk', () => {
	it('asks for no microphone and creates no AudioContext before a press', () => {
		renderSubject()

		expect(getUserMedia).not.toHaveBeenCalled()
		expect(contexts).toHaveLength(0)
	})

	it('presses Hold to talk while it is held', async () => {
		renderSubject()

		await pressTalk()

		expect(talkButton()).toHaveAttribute('aria-pressed', 'true')
	})

	it("streams through PlayStream as mono pcm16 at GetProperties' sample rate", async () => {
		renderSubject()

		await pressTalk()

		expect(streamCall().info).toEqual(
			expect.objectContaining({
				codec: 'pcm16',
				sampleRateHz: DEVICE_SAMPLE_RATE_HZ,
				numChannels: 1,
			})
		)
	})

	it('sends what is heard to PlayStream while Hold to talk is still held', async () => {
		renderSubject()

		await holdUntilHeard()

		const call = streamCall()
		expect(call.isEnded, 'the stream is still open').toBe(false)
		expect(call.received.length, 'one chunk per captured quantum').toBeGreaterThan(1)
		expect(
			clipPeak(streamedBytes(call)),
			'the full scale oscillator reaches past half scale'
		).toBeGreaterThan(INT16_HALF_SCALE)
	})

	it('sends the audio still queued at release before the stream ends', async () => {
		const reading = gateStreamReading()
		renderSubject()
		await holdUntilHeard()
		await fireEvent.pointerUp(talkButton())

		reading.resolve(undefined)

		await vi.waitFor(() => expect(streamCall().isEnded).toBe(true))
		expect(streamCall().received.length, 'the chunks queued while held').toBeGreaterThan(1)
		expect(
			clipPeak(streamedBytes(streamCall())),
			'the full scale oscillator reaches past half scale'
		).toBeGreaterThan(INT16_HALF_SCALE)
	})

	it('sends no clip through Play after a streamed hold', async () => {
		renderSubject()
		await holdUntilHeard()

		await fireEvent.pointerUp(talkButton())

		await vi.waitFor(() => expect(streamCall().isEnded).toBe(true))
		expect(state.play).not.toHaveBeenCalled()
	})

	it('records at 48000 Hz when GetProperties reports no sample rate', async () => {
		state.properties = { supportedCodecs: [], sampleRateHz: 0, numChannels: 0 }
		renderSubject()

		await pressTalk()

		expect(contexts.map((context) => context.sampleRate)).toEqual([48_000])
	})

	it.each([
		{
			path: 'pointer up on the button',
			release: async () => fireEvent.pointerUp(talkButton()),
		},
		{
			path: 'pointer up outside the button',
			release: async () => fireEvent.pointerUp(globalThis.window),
		},
		{
			path: 'pointer cancel',
			release: async () => fireEvent.pointerCancel(talkButton()),
		},
		{
			path: 'window blur',
			release: async () => fireEvent.blur(globalThis.window),
		},
		{
			path: 'a hidden tab',
			release: async () => {
				vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
				await fireEvent(document, new Event('visibilitychange'))
			},
		},
	])('ends the stream and stops the microphone on $path', async ({ release }) => {
		renderSubject()
		await holdUntilHeard()

		await release()

		expect(talkButton()).toHaveAttribute('aria-pressed', 'false')
		expect(microphoneTrackStates()).toEqual(['ended'])
		await vi.waitFor(() => expect(streamCall().isEnded).toBe(true))
	})

	it.each(['Space', 'Enter'])(
		'holds while %s is down and ends the stream on its key up',
		async (keyName) => {
			renderSubject()
			talkButton().focus()
			await user.keyboard(`[${keyName}>]`)
			await vi.waitFor(() => expect(microphones).toHaveLength(1))
			expect(talkButton(), 'held while the key is down').toHaveAttribute('aria-pressed', 'true')
			await waitMs(HELD_MS)

			await user.keyboard(`[/${keyName}]`)

			expect(talkButton(), 'released on key up').toHaveAttribute('aria-pressed', 'false')
			expect(microphoneTrackStates()).toEqual(['ended'])
			await vi.waitFor(() => expect(streamCall().isEnded).toBe(true))
		}
	)

	it('ends the stream, stops the microphone, and closes the context on unmount', async () => {
		const { unmount } = renderSubject()
		await holdUntilHeard()

		unmount()

		expect(microphoneTrackStates()).toEqual(['ended'])
		await vi.waitFor(() => expect(contexts.map((context) => context.state)).toEqual(['closed']))
		await vi.waitFor(() => expect(streamCall().isEnded).toBe(true))
	})

	it('reports a denied microphone in the section indicator', async () => {
		getUserMedia.mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'))
		renderSubject()

		await fireEvent.pointerDown(talkButton(), { button: 0 })

		expect(
			await screen.findByRole('button', { name: '1 error, copy to clipboard' })
		).toBeInTheDocument()
	})

	it('writes Hold to talk failed to the status line after a denied microphone', async () => {
		getUserMedia.mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'))
		renderSubject()

		await fireEvent.pointerDown(talkButton(), { button: 0 })

		await vi.waitFor(() =>
			expect(screen.getByTestId('status-line')).toHaveTextContent('Hold to talk failed')
		)
	})

	it('keeps Hold to talk enabled and unpressed after a denied microphone', async () => {
		getUserMedia.mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'))
		renderSubject()

		await fireEvent.pointerDown(talkButton(), { button: 0 })

		await vi.waitFor(() => expect(talkButton()).toHaveAttribute('aria-pressed', 'false'))
		expect(talkButton()).not.toHaveAttribute('aria-disabled')
	})

	it('marks Hold to talk busy after release until PlayStream settles', async () => {
		state.playStream.mockImplementation(collectStreamThenHang)
		renderSubject()
		await holdUntilHeard()

		await fireEvent.pointerUp(talkButton())

		await vi.waitFor(() =>
			expect(talkButton().querySelector('.progress-dots'), 'progress dots').not.toBeNull()
		)
		expect(talkButton()).toHaveAttribute('aria-pressed', 'false')
	})

	it('keeps Hold to talk enabled while its own PlayStream holds the playback group', async () => {
		state.playStream.mockImplementation(collectStreamThenHang)
		renderWithPlay()
		await chooseFile(wavFile())
		await holdUntilHeard()

		await fireEvent.pointerUp(talkButton())

		await vi.waitFor(() =>
			expect(talkButton().querySelector('.progress-dots'), 'progress dots').not.toBeNull()
		)
		expect(talkButton()).not.toHaveAttribute('aria-disabled')
		expect(playButton(), 'Play shares the playback group').toHaveAttribute('aria-disabled', 'true')
	})

	it('enables Play once the streamed hold settles', async () => {
		renderWithPlay()
		await chooseFile(wavFile())
		await holdUntilHeard()

		await fireEvent.pointerUp(talkButton())

		await vi.waitFor(() => expect(streamCall().isEnded).toBe(true))
		await vi.waitFor(() => expect(playButton()).not.toHaveAttribute('aria-disabled'))
	})

	it('ignores a press of Hold to talk while the last PlayStream has not settled', async () => {
		state.playStream.mockImplementation(collectStreamThenHang)
		renderSubject()
		await holdUntilHeard()
		await fireEvent.pointerUp(talkButton())
		await vi.waitFor(() =>
			expect(talkButton().querySelector('.progress-dots'), 'progress dots').not.toBeNull()
		)

		await fireEvent.pointerDown(talkButton(), { button: 0 })

		expect(state.playStream).toHaveBeenCalledTimes(1)
		expect(getUserMedia).toHaveBeenCalledTimes(1)
		expect(talkButton()).toHaveAttribute('aria-pressed', 'false')
	})

	describe('on a transport that cannot carry PlayStream', () => {
		it('keeps recording while held after PlayStream fails on the first press', async () => {
			useTransportWithoutClientStreams()
			renderSubject()

			await pressTalkAfterFallback()

			expect(talkButton()).toHaveAttribute('aria-pressed', 'true')
			expect(microphoneTrackStates()).toEqual(['ended', 'live'])
		})

		it("sends what was heard on release as one mono pcm16 clip at GetProperties' sample rate", async () => {
			useTransportWithoutClientStreams()
			renderSubject()
			await holdUntilHeardAfterFallback()

			await fireEvent.pointerUp(talkButton())

			await vi.waitFor(() => expect(state.play).toHaveBeenCalledTimes(1))
			const { audioData, info } = sentClip()
			expect(info).toEqual(
				expect.objectContaining({
					codec: 'pcm16',
					sampleRateHz: DEVICE_SAMPLE_RATE_HZ,
					numChannels: 1,
				})
			)
			expect(audioData.byteLength % 2, 'whole int16 samples').toBe(0)
			expect(
				clipPeak(audioData),
				'the full scale oscillator reaches past half scale'
			).toBeGreaterThan(INT16_HALF_SCALE)
		})

		it('records later presses without trying PlayStream again', async () => {
			renderSubject()
			await talkOnceWithoutClientStreams()

			await holdUntilHeard()
			await fireEvent.pointerUp(talkButton())

			await vi.waitFor(() => expect(state.play).toHaveBeenCalledTimes(2))
			expect(state.playStream, 'PlayStream is tried once').toHaveBeenCalledTimes(1)
		})

		it("keeps the transport's error out of the section indicator", async () => {
			renderSubject()

			await talkOnceWithoutClientStreams()

			expect(screen.getByRole('button', { name: 'No errors' })).toBeInTheDocument()
		})

		it('ends recording and stops the microphone on release', async () => {
			renderSubject()
			await talkOnceWithoutClientStreams()
			await holdUntilHeard()

			await fireEvent.pointerUp(globalThis.window)

			expect(talkButton()).toHaveAttribute('aria-pressed', 'false')
			expect(microphoneTrackStates()).toEqual(['ended'])
		})

		it('sends nothing for a release before any audio was heard', async () => {
			renderSubject()
			await talkOnceWithoutClientStreams()
			const microphone = deferred<MediaStream>()
			getUserMedia.mockImplementation(() => microphone.promise)
			await fireEvent.pointerDown(talkButton(), { button: 0 })

			await fireEvent.pointerUp(talkButton())
			microphone.resolve(await openOscillatorMicrophone())
			await waitMs(HELD_MS)

			expect(state.play, 'only the first press sent a clip').toHaveBeenCalledTimes(1)
			expect(microphoneTrackStates(), 'the late microphone is stopped').toEqual(['ended'])
		})

		it('disables Play and marks Hold to talk busy while its clip is sending', async () => {
			renderWithPlay()
			await talkOnceWithoutClientStreams()
			state.play.mockReturnValue(new Promise(() => undefined))
			await chooseFile(wavFile())
			await holdUntilHeard()

			await fireEvent.pointerUp(talkButton())

			await vi.waitFor(() =>
				expect(talkButton().querySelector('.progress-dots'), 'progress dots').not.toBeNull()
			)
			expect(playButton()).toHaveAttribute('aria-disabled', 'true')
		})

		it('ignores a press of Hold to talk while its clip is sending', async () => {
			renderSubject()
			await talkOnceWithoutClientStreams()
			state.play.mockReturnValue(new Promise(() => undefined))
			await holdUntilHeard()
			await fireEvent.pointerUp(talkButton())
			await vi.waitFor(() =>
				expect(talkButton().querySelector('.progress-dots'), 'progress dots').not.toBeNull()
			)

			await fireEvent.pointerDown(talkButton(), { button: 0 })

			expect(microphones, 'no microphone after the sending press').toHaveLength(1)
			expect(talkButton()).toHaveAttribute('aria-pressed', 'false')
		})
	})

	it('disables Play while Hold to talk is held', async () => {
		renderWithPlay()
		await chooseFile(wavFile())

		await pressTalk()

		expect(playButton()).toHaveAttribute('aria-disabled', 'true')
	})

	it('disables Hold to talk while Play is in flight', async () => {
		state.play.mockReturnValue(new Promise(() => undefined))
		renderWithPlay()
		await chooseFile(wavFile())

		await user.click(playButton())

		await vi.waitFor(() =>
			expect(playButton().querySelector('.progress-dots'), 'progress dots').not.toBeNull()
		)
		expect(talkButton()).toHaveAttribute('aria-disabled', 'true')
	})

	it('keeps the root and the pane within 320 px', async () => {
		render(Pane, { props: { widget: Subject } })
		await pressTalk()

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? pane
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
