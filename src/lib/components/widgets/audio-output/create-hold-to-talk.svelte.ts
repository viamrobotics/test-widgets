import type { AudioOutClient } from '@viamrobotics/sdk'

import { createAudioPlayer } from './create-audio-player.svelte.ts'
import { createAudioStream } from './create-audio-stream.svelte.ts'
import { createTalkRecorder } from './create-talk-recorder.svelte.ts'

type TalkSink = Pick<AudioOutClient, 'play' | 'playStream'>

const TALK_CODEC = 'pcm16'
const TALK_CHANNELS = 1

// The fetch based transports of `@connectrpc/connect-web` throw this for every call with a request
// stream, before anything is sent. The WebRTC transport carries request streams.
const CANNOT_STREAM_MESSAGE = 'The fetch API does not support streaming request bodies'

const isCannotStreamError = (error: unknown) =>
	error instanceof Error && error.message.includes(CANNOT_STREAM_MESSAGE)

/**
 * Hold to talk for an audio output. While held, the microphone streams through `PlayStream` as
 * mono `pcm16`. The SDK offers no way to ask whether the transport carries a request stream, so
 * the first press tries `PlayStream`. When the transport cannot carry it, that press and every
 * later one records while held and sends one clip through `Play` on release. `press` asks for the
 * microphone, so nothing does before a press. `release` ends the stream once its queued audio is
 * sent, or ends the recording. Unmount ends either at once. A press while held or while the last call is still sending is dropped.
 */
export const createHoldToTalk = (client: { current: TalkSink | undefined }) => {
	let canStream = true
	let isStreamCallPending = $state(false)
	// The sample rate of the press `PlayStream` carries, until its release.
	let heldStreamSampleRateHz = $state<number | undefined>()

	const player = createAudioPlayer(client)
	const recorder = createTalkRecorder((clip) => {
		void player.play(clip.audioData, TALK_CODEC, clip.sampleRateHz, TALK_CHANNELS)
	})

	const fallBackToClips = (error: unknown) => {
		if (!isCannotStreamError(error)) return
		canStream = false
		const sampleRateHz = heldStreamSampleRateHz
		heldStreamSampleRateHz = undefined
		if (sampleRateHz !== undefined) recorder.press(sampleRateHz)
	}

	const streamSink = {
		get current() {
			const sink = client.current
			if (sink === undefined) return undefined
			return {
				playStream: async (...args: Parameters<TalkSink['playStream']>) => {
					isStreamCallPending = true
					try {
						await sink.playStream(...args)
					} catch (error) {
						fallBackToClips(error)
						throw error
					} finally {
						isStreamCallPending = false
					}
				},
			}
		},
	}
	const stream = createAudioStream(streamSink)

	const streamFailure = {
		get error() {
			return isCannotStreamError(stream.error) ? null : stream.error
		},
	}

	const isStreamHeld = $derived(heldStreamSampleRateHz !== undefined)
	// A released stream stays `streaming` while the call reads its last queued chunks.
	const isHeld = $derived((isStreamHeld && stream.status === 'streaming') || recorder.isHeld)
	const isSending = $derived(player.status === 'playing' || (isStreamCallPending && !isStreamHeld))

	const press = (sampleRateHz: number) => {
		if (isHeld || isSending) return
		if (!canStream) {
			recorder.press(sampleRateHz)
			return
		}
		heldStreamSampleRateHz = sampleRateHz
		stream.start(
			{ codec: TALK_CODEC, sampleRateHz, numChannels: TALK_CHANNELS },
			{ kind: 'microphone' }
		)
	}

	const release = () => {
		heldStreamSampleRateHz = undefined
		recorder.release()
		stream.finish()
	}

	return {
		get isHeld() {
			return isHeld
		},
		/** True after a release while the press's `Play` or `PlayStream` call has not settled. */
		get isSending() {
			return isSending
		},
		/** For the section indicator. A transport that cannot stream is a fallback, not a failure. */
		errorSources: [recorder, player, streamFailure],
		press,
		release,
	}
}
