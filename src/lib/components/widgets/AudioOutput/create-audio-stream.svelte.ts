import { AudioOutClient, commonApi } from '@viamrobotics/sdk'
import { toError } from '#lib/components/MediaFrame/to-error.js'

import { type ChunkQueue, createChunkQueue } from './create-chunk-queue.ts'
import { createMicrophoneStreamer } from './create-microphone-streamer.svelte.ts'
type StreamStatus = 'idle' | 'streaming' | 'done' | 'error'

type AudioStreamSink = Pick<AudioOutClient, 'playStream'>

interface StreamFormat {
	codec: string
	sampleRateHz: number
	numChannels: number
}

type StreamSource = { kind: 'file'; audioData: Uint8Array } | { kind: 'microphone' }

interface StreamRun {
	queue: ChunkQueue
	isMicrophone: boolean
	timer: ReturnType<typeof setInterval>
	/** Settles once the run has ended, however it ended. */
	ended: Promise<void>
	markEnded: () => void
}

const FILE_CHUNK_BYTES = 8192
const ELAPSED_TICK_MS = 1000

/**
 * One audio stream at a time through `PlayStream`, from a file or the microphone. `stop`, `finish`,
 * and unmount end the running stream. Every stream has its own queue, so a stream started after a
 * stopped one never receives the stopped one's chunks.
 */
export const createAudioStream = (client: { current: AudioStreamSink | undefined }) => {
	let status = $state<StreamStatus>('idle')
	let streamError = $state<Error | null>(null)
	let sentBytes = $state(0)
	let elapsedSeconds = $state(0)

	let run: StreamRun | undefined

	const recorder = createMicrophoneStreamer((chunk) => run?.queue.push(chunk))

	const endRun = (ending: StreamRun) => {
		clearInterval(ending.timer)
		ending.markEnded()
		if (ending.isMicrophone) recorder.release()
		if (run === ending) run = undefined
	}

	const stop = () => {
		const ending = run
		if (ending === undefined) return
		ending.queue.abort()
		endRun(ending)
		status = 'done'
	}

	const finish = () => {
		const finishing = run
		if (finishing === undefined) return
		if (finishing.isMicrophone) recorder.release()
		finishing.queue.close()
	}

	// A microphone that cannot open ends the stream it was meant to feed.
	$effect(() => {
		if (recorder.error === null || run === undefined) return
		const failure = recorder.error
		stop()
		status = 'error'
		streamError = failure
	})

	const beginRun = (isMicrophone: boolean): StreamRun => {
		sentBytes = 0
		elapsedSeconds = 0
		streamError = null
		status = 'streaming'

		const startedAt = Date.now()
		let markEnded = () => {}
		const ended = new Promise<void>((resolve) => {
			markEnded = resolve
		})
		const beginning: StreamRun = {
			ended,
			markEnded,
			queue: createChunkQueue((chunk) => {
				sentBytes += chunk.byteLength
			}),
			isMicrophone,
			timer: setInterval(() => {
				elapsedSeconds = Math.floor((Date.now() - startedAt) / ELAPSED_TICK_MS)
			}, ELAPSED_TICK_MS),
		}
		run = beginning
		return beginning
	}

	const watchPlayStream = (watched: StreamRun, call: Promise<void>) => {
		call
			.then(() => {
				if (run !== watched) return
				endRun(watched)
				status = 'done'
			})
			.catch((error: unknown) => {
				if (run !== watched) return
				endRun(watched)
				status = 'error'
				streamError = toError(error)
			})
	}

	const feedFile = (feeding: StreamRun, audioData: Uint8Array) => {
		for (let offset = 0; offset < audioData.byteLength; offset += FILE_CHUNK_BYTES) {
			feeding.queue.push(audioData.slice(offset, offset + FILE_CHUNK_BYTES))
		}
		feeding.queue.close()
	}

	const start = (format: StreamFormat, source: StreamSource): Promise<void> => {
		const sink = client.current
		if (sink === undefined || run !== undefined) return Promise.resolve()

		const starting = beginRun(source.kind === 'microphone')
		watchPlayStream(
			starting,
			sink.playStream(commonApi.AudioInfo.fromJson({ ...format }), starting.queue.chunks)
		)

		if (source.kind === 'microphone') recorder.press(format.sampleRateHz)
		else feedFile(starting, source.audioData)
		return starting.ended
	}

	$effect(() => stop)

	return {
		get status() {
			return status
		},
		get error() {
			return streamError
		},
		get sentBytes() {
			return sentBytes
		},
		get elapsedSeconds() {
			return elapsedSeconds
		},
		/**
		 * Begins a stream, and returns a promise that settles once it ends. Returns an already settled
		 * promise when no stream began.
		 */
		start,
		/** Ends the running stream now and drops the chunks the call has not read. */
		stop,
		/**
		 * Releases the microphone and ends the running stream once the call reads the chunks already
		 * queued. The status stays `streaming` until the call settles.
		 */
		finish,
	}
}
