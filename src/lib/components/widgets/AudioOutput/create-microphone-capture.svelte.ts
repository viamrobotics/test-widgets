import { toError } from '#lib/components/MediaFrame/to-error.js'

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

/** One press of a held microphone, from `press` to its release. */
interface TalkSession {
	context: AudioContext
	chunks: Float32Array[]
	stream: MediaStream | undefined
	isReleased: boolean
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

/** What a held microphone does with each captured quantum, and once it is released. */
interface CaptureHandlers {
	onSamples: (session: TalkSession, samples: Float32Array) => void
	onReleased: (session: TalkSession) => void
}

/**
 * Captures the microphone while held, mono, through an audio worklet. `press` creates the
 * `AudioContext` at the given sample rate and asks for the microphone, so neither happens before a
 * press. `release` ends the capture and calls `onReleased`. Unmount is a release.
 */
export const createMicrophoneCapture = ({ onSamples, onReleased }: CaptureHandlers) => {
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
