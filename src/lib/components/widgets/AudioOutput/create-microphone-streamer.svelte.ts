import { createMicrophoneCapture } from './create-microphone-capture.svelte.ts'
import { encodePcm16 } from './encode-pcm16'

/**
 * Streams the microphone while held. Each captured quantum goes to `onChunk` as raw little-endian
 * `pcm16` as it arrives, and nothing is kept. `press` creates the `AudioContext` at the given sample rate and asks for
 * the microphone, so neither happens before a press. `release` and unmount end the capture.
 */
export const createMicrophoneStreamer = (onChunk: (chunk: Uint8Array<ArrayBuffer>) => void) =>
	createMicrophoneCapture({
		onSamples: (_session, samples) => {
			onChunk(encodePcm16([samples]))
		},
		onReleased: () => undefined,
	})
