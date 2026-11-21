import type { AudioChunk, AudioInClient } from '@viamrobotics/sdk'

import { toError } from '$lib/components/media-frame/to-error'

import { decodePcm, PcmDecodeError } from './pcm-decode'

interface ListenSession {
	controller: AbortController
	context: AudioContext
	/** When the next chunk starts, on the context's clock, so chunks play back to back. */
	nextStartTime: number
}

interface RecordingDownload {
	url: string
	fileName: string
}

const peakLevel = (samples: Float32Array) => {
	let peak = 0
	for (const sample of samples) peak = Math.max(peak, Math.abs(sample))
	return Math.min(1, peak)
}

/**
 * Plays an audio input live: GetAudio at duration 0, each PCM chunk decoded by its own audio info
 * and scheduled after the one before. The `AudioContext` is created by `listen`, so nothing plays
 * before a press. Record keeps the raw chunk bytes for a download once it is released.
 */
export const createAudioListener = (client: { current: AudioInClient | undefined }) => {
	let isListening = $state(false)
	let isRecording = $state(false)
	let hasHeardChunk = $state(false)
	let levels = $state.raw<number[]>([])
	let error = $state<Error | null>(null)
	let recordedBytes = $state(0)
	let elapsedSeconds = $state(0)
	let download = $state.raw<RecordingDownload>()

	let session: ListenSession | undefined
	let recordingCodec = ''
	let recordedChunks: Uint8Array<ArrayBuffer>[] = []

	const revokeDownload = () => {
		if (download) URL.revokeObjectURL(download.url)
		download = undefined
	}

	const stopRecording = () => {
		if (!isRecording) return
		isRecording = false
		if (recordedChunks.length === 0) return
		const blob = new Blob(recordedChunks, { type: 'application/octet-stream' })
		download = {
			url: URL.createObjectURL(blob),
			fileName: `audio-recording.${recordingCodec}`,
		}
		recordedChunks = []
	}

	const endSession = (endingSession: ListenSession) => {
		if (session !== endingSession) return
		session = undefined
		endingSession.controller.abort()
		void endingSession.context.close()
		isListening = false
		hasHeardChunk = false
		levels = []
		stopRecording()
	}

	const keepRecorded = (chunk: AudioChunk, frameCount: number, sampleRateHz: number) => {
		recordedChunks.push(new Uint8Array(chunk.audioData))
		recordedBytes += chunk.audioData.byteLength
		elapsedSeconds += frameCount / sampleRateHz
	}

	const play = (current: ListenSession, chunk: AudioChunk) => {
		const info = chunk.audioInfo
		if (info === undefined) throw new PcmDecodeError('An audio chunk arrived without audio info')

		const channels = decodePcm(chunk.audioData, info.codec, info.numChannels)
		const frameCount = channels[0]?.length ?? 0
		hasHeardChunk = true
		levels = channels.map((samples) => peakLevel(samples))
		if (isRecording) keepRecorded(chunk, frameCount, info.sampleRateHz)
		if (frameCount === 0) return

		const { context } = current
		const buffer = context.createBuffer(channels.length, frameCount, info.sampleRateHz)
		for (const [channel, samples] of channels.entries()) {
			buffer.copyToChannel(samples, channel)
		}
		const source = context.createBufferSource()
		source.buffer = buffer
		source.connect(context.destination)
		const startTime = Math.max(context.currentTime, current.nextStartTime)
		source.start(startTime)
		current.nextStartTime = startTime + buffer.duration
	}

	const listen = async (codec: string) => {
		const audioIn = client.current
		if (audioIn === undefined || session !== undefined) return

		const current: ListenSession = {
			controller: new AbortController(),
			context: new AudioContext(),
			nextStartTime: 0,
		}
		session = current
		recordingCodec = codec
		isListening = true
		hasHeardChunk = false
		error = null
		levels = []

		try {
			const stream = audioIn.getAudio(
				codec,
				0,
				0n,
				{},
				{ ...audioIn.callOptions, signal: current.controller.signal }
			)
			for await (const chunk of stream) {
				if (current.controller.signal.aborted) break
				play(current, chunk)
			}
		} catch (error_) {
			// An abort is the person pressing Listen again or unmounting, which is not a failure.
			if (!current.controller.signal.aborted) error = toError(error_)
		} finally {
			endSession(current)
		}
	}

	const stop = () => {
		if (session) endSession(session)
	}

	const startRecording = () => {
		if (session === undefined || !hasHeardChunk || isRecording) return
		revokeDownload()
		recordedChunks = []
		recordedBytes = 0
		elapsedSeconds = 0
		isRecording = true
	}

	// Unmount: no state is written here, only the stream, the context, and the URL are released.
	$effect(() => () => {
		session?.controller.abort()
		void session?.context.close()
		session = undefined
		if (download) URL.revokeObjectURL(download.url)
	})

	return {
		get isListening() {
			return isListening
		},
		/** True once Listen has decoded a chunk. Reset when Listen stops. */
		get hasHeardChunk() {
			return hasHeardChunk
		},
		get isRecording() {
			return isRecording
		},
		/** Each channel's peak in the latest chunk, from 0 to 1. Empty while not listening. */
		get levels() {
			return levels
		},
		get error() {
			return error
		},
		get recordedBytes() {
			return recordedBytes
		},
		/** Seconds of audio recorded, counted from the recorded samples. */
		get elapsedSeconds() {
			return elapsedSeconds
		},
		/** The last recording, once Record is released. */
		get download() {
			return download
		},
		listen,
		stop,
		startRecording,
		stopRecording,
	}
}
