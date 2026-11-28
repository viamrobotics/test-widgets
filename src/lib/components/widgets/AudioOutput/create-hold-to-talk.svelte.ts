import type { AudioOutClient } from '@viamrobotics/sdk'
import type { InFlightGuard } from '#lib/components/in-flight-guard.svelte.js'

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
 * sent, or ends the recording and sends its clip. Unmount ends either at once.
 *
 * @param playback The audio output's playback group. A press holds it from the press until the
 *   press's call settles. A press while the group is busy, or while held or sending, is dropped.
 */
export const createHoldToTalk = (
	client: { current: TalkSink | undefined },
	playback: InFlightGuard
) => {
	let canStream = true
	let isStreamCallPending = $state(false)
	// The sample rate of the press `PlayStream` carries, until its release.
	let heldStreamSampleRateHz = $state<number | undefined>()
	let ownsPlayback = $state(false)
	let isClipPending = false
	// Resolves the promise that holds the playback group for the current press.
	let settlePress: (() => void) | undefined

	const endPress = () => {
		const settle = settlePress
		settlePress = undefined
		settle?.()
	}

	const player = createAudioPlayer(client)
	const recorder = createTalkRecorder((clip) => {
		isClipPending = true
		void player.play(clip.audioData, TALK_CODEC, clip.sampleRateHz, TALK_CHANNELS).finally(() => {
			isClipPending = false
			endPress()
		})
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

	const startStreaming = (sampleRateHz: number) => {
		// With no client no stream starts, so the press ends here and holds nothing.
		if (client.current === undefined) {
			endPress()
			return
		}
		heldStreamSampleRateHz = sampleRateHz
		const streamEnded = stream.start(
			{ codec: TALK_CODEC, sampleRateHz, numChannels: TALK_CHANNELS },
			{ kind: 'microphone' }
		)
		void streamEnded.then(() => {
			// A stream the transport could not carry hands a still held press to the recorder.
			if (!recorder.isHeld) endPress()
		})
	}

	const press = (sampleRateHz: number) => {
		if (isHeld || isSending) return
		const held = playback.run(
			() =>
				new Promise<void>((resolve) => {
					settlePress = resolve
				})
		)
		if (held === undefined) return
		ownsPlayback = true
		// Cleared once the group is idle again, so the button is never disabled in between.
		void held.finally(() => {
			ownsPlayback = false
		})

		if (canStream) startStreaming(sampleRateHz)
		else recorder.press(sampleRateHz)
	}

	const release = () => {
		heldStreamSampleRateHz = undefined
		recorder.release()
		stream.finish()
		// A recording released before anything was heard sends nothing, so the press ends here.
		if (settlePress !== undefined && !isClipPending && !isStreamCallPending && !recorder.isHeld) {
			endPress()
		}
	}

	// The playback group outlives this widget, so unmount gives it back at once.
	$effect(() => () => {
		release()
		endPress()
	})

	return {
		get isHeld() {
			return isHeld
		},
		/** True after a release while the press's `Play` or `PlayStream` call has not settled. */
		get isSending() {
			return isSending
		},
		/** True from a press until its call settles, while this control holds the playback group. */
		get ownsPlayback() {
			return ownsPlayback
		},
		/** For the section indicator. A transport that cannot stream is a fallback, not a failure. */
		errorSources: [recorder, player, streamFailure],
		press,
		release,
	}
}
