import { createMicrophoneCapture } from './create-microphone-capture.svelte.ts'
import { encodePcm16 } from './encode-pcm16'

/** What was heard while Hold to talk was held, as raw little-endian `pcm16`, mono. */
interface TalkClip {
	audioData: Uint8Array<ArrayBuffer>
	sampleRateHz: number
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
