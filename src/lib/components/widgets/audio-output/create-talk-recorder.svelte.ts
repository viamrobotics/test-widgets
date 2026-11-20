import { toError } from '$lib/components/media-frame/to-error'

import { encodePcm16 } from './encode-pcm16'

const CAPTURE_PROCESSOR_NAME = 'talk-capture'

// The worklet posts a copy of each render quantum's first input channel to the page, and has no
// output, so the microphone never reaches the speaker.
const CAPTURE_PROCESSOR_SOURCE = `
class TalkCaptureProcessor extends AudioWorkletProcessor {
	process(inputs) {
		const samples = inputs[0]?.[0]
		if (samples) this.port.postMessage(samples.slice())
		return true
	}
}
registerProcessor('${CAPTURE_PROCESSOR_NAME}', TalkCaptureProcessor)
`

interface TalkSession {
	context: AudioContext
	chunks: Float32Array[]
	stream: MediaStream | undefined
	isReleased: boolean
}

/** What was heard while Hold to talk was held, as raw little-endian `pcm16`, mono. */
export interface TalkClip {
	audioData: Uint8Array<ArrayBuffer>
	sampleRateHz: number
}

const stopTracks = (stream: MediaStream | undefined) => {
	for (const track of stream?.getTracks() ?? []) track.stop()
}

const loadCaptureProcessor = async (context: AudioContext) => {
	const url = URL.createObjectURL(new Blob([CAPTURE_PROCESSOR_SOURCE], { type: 'text/javascript' }))
	try {
		await context.audioWorklet.addModule(url)
	} finally {
		URL.revokeObjectURL(url)
	}
}

interface CaptureHandlers {
	onSamples: (session: TalkSession, samples: Float32Array) => void
	onReleased: (session: TalkSession) => void
}

const createMicrophoneCapture = ({ onSamples, onReleased }: CaptureHandlers) => {
	let isHeld = $state(false)
	let error = $state<Error | null>(null)

	let session: TalkSession | undefined

	const endSession = (current: TalkSession) => {
		current.isReleased = true
		stopTracks(current.stream)
		void current.context.close()
		if (session === current) {
			session = undefined
			isHeld = false
		}
	}

	const capture = async (current: TalkSession) => {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		current.stream = stream
		if (current.isReleased) {
			stopTracks(stream)
			return
		}

		await loadCaptureProcessor(current.context)
		if (current.isReleased) return

		const source = current.context.createMediaStreamSource(stream)
		const node = new AudioWorkletNode(current.context, CAPTURE_PROCESSOR_NAME, {
			channelCount: 1,
			channelCountMode: 'explicit',
			numberOfOutputs: 0,
		})
		node.port.addEventListener('message', (event: MessageEvent<unknown>) => {
			if (current.isReleased || !(event.data instanceof Float32Array)) return
			onSamples(current, event.data)
		})
		node.port.start()
		source.connect(node)
	}

	const fail = (current: TalkSession, caught: unknown) => {
		// A release while the microphone or the worklet was still loading closes the context,
		// which is the person letting go, not a failure.
		if (current.isReleased) return
		error = toError(caught)
		endSession(current)
	}

	const press = (sampleRateHz: number) => {
		if (session !== undefined) return
		error = null

		let context: AudioContext
		try {
			context = new AudioContext({ sampleRate: sampleRateHz })
		} catch (error_) {
			error = toError(error_)
			return
		}

		const current: TalkSession = { context, chunks: [], stream: undefined, isReleased: false }
		session = current
		isHeld = true
		capture(current).catch((error_: unknown) => {
			fail(current, error_)
		})
	}

	const release = () => {
		const current = session
		if (current === undefined) return
		endSession(current)

		onReleased(current)
	}

	$effect(() => release)

	return {
		get isHeld() {
			return isHeld
		},
		/** The last failure to open the microphone or start recording, cleared by the next press. */
		get error() {
			return error
		},
		press,
		release,
	}
}

/**
 * Records the microphone while held, for Hold to talk. `press` creates the `AudioContext` at the
 * given sample rate and asks for the microphone, so neither happens before a press. `release`
 * ends the recording and hands what was heard to `onClip`, and hands nothing when nothing was
 * heard. Unmount is a release.
 */
export const createTalkRecorder = (onClip: (clip: TalkClip) => void) =>
	createMicrophoneCapture({
		onSamples: (session, samples) => session.chunks.push(samples),
		onReleased: (session) => {
			const clip = encodePcm16(session.chunks)
			if (clip.byteLength === 0) return
			onClip({ audioData: clip, sampleRateHz: session.context.sampleRate })
		},
	})

/**
 * Streams the microphone while held. Each captured quantum goes to `onChunk` as raw little-endian
 * `pcm16` as it arrives, and nothing is kept. `press`, `release`, and unmount behave as they do
 * for `createTalkRecorder`.
 */
export const createMicrophoneStreamer = (onChunk: (chunk: Uint8Array<ArrayBuffer>) => void) =>
	createMicrophoneCapture({
		onSamples: (_session, samples) => {
			onChunk(encodePcm16([samples]))
		},
		onReleased: () => undefined,
	})
