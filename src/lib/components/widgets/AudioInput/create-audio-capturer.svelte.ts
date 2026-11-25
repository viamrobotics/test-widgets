import { AudioInClient } from '@viamrobotics/sdk'

type CaptureStatus = 'idle' | 'recording' | 'done' | 'error'

export const createAudioCapturer = (client: { current: AudioInClient | undefined }) => {
	let captureStatus = $state<CaptureStatus>('idle')
	let captureError = $state<Error | null>(null)
	let captureTotalBytes = $state(0)
	let captureDownloadUrl = $state<string>()
	let captureAbortController = $state.raw<AbortController>()

	$effect(() => {
		return () => {
			if (captureDownloadUrl) URL.revokeObjectURL(captureDownloadUrl)
		}
	})

	const start = async (codec: string, duration: number) => {
		if (!client.current) return

		captureStatus = 'recording'
		captureError = null
		captureTotalBytes = 0

		if (captureDownloadUrl) {
			URL.revokeObjectURL(captureDownloadUrl)
			captureDownloadUrl = undefined
		}

		const controller = new AbortController()
		captureAbortController = controller

		const chunks: Uint8Array[] = []

		try {
			const stream = client.current.getAudio(
				codec,
				duration,
				0n,
				{},
				{ ...client.current.callOptions, signal: controller.signal }
			)

			for await (const chunk of stream) {
				chunks.push(chunk.audioData)
				captureTotalBytes += chunk.audioData.byteLength
			}

			captureStatus = 'done'
		} catch (error) {
			if (controller.signal.aborted) {
				captureStatus = 'done'
			} else {
				captureStatus = 'error'
				captureError = error instanceof Error ? error : new Error(String(error))
			}
		} finally {
			captureAbortController = undefined
		}

		if (chunks.length > 0) {
			const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0)
			const merged = new Uint8Array(totalLength)
			let offset = 0
			for (const chunk of chunks) {
				merged.set(chunk, offset)
				offset += chunk.byteLength
			}

			const mimeTypes: Record<string, string> = {
				mp3: 'audio/mpeg',
				wav: 'audio/wav',
				aac: 'audio/aac',
				opus: 'audio/ogg',
				flac: 'audio/flac',
			}
			const mimeType = mimeTypes[codec] ?? 'audio/octet-stream'
			captureDownloadUrl = URL.createObjectURL(new Blob([merged], { type: mimeType }))
		}
	}

	const stop = () => {
		captureAbortController?.abort()
	}

	return {
		get status() {
			return captureStatus
		},
		get error() {
			return captureError
		},
		get totalBytes() {
			return captureTotalBytes
		},
		get downloadUrl() {
			return captureDownloadUrl
		},
		start,
		stop,
	}
}
