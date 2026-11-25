import { flushSync } from 'svelte'
import { describe, expect, it, vi } from 'vitest'

import { createAudioCapturer } from '../create-audio-capturer.svelte.ts'

type MockAudioInClient = {
	callOptions: Record<string, unknown>
	getAudio: ReturnType<typeof vi.fn>
}

const makeClient = (mockGetAudio: ReturnType<typeof vi.fn>): { current: MockAudioInClient } => ({
	current: {
		callOptions: {},
		getAudio: mockGetAudio,
	},
})

async function* makeChunkStream(chunks: Uint8Array[]) {
	for (const chunk of chunks) {
		yield { audioData: chunk }
	}
}

async function* makeErrorStream(message: string) {
	yield { audioData: new Uint8Array([1]) }
	throw new Error(message)
}

async function* makeAbortableStream(signal: AbortSignal) {
	yield { audioData: new Uint8Array([1, 2, 3]) }
	await new Promise<never>((_, reject) => {
		signal.addEventListener('abort', () => reject(signal.reason))
	})
}

describe('createAudioCapture', () => {
	it('successful capture sets status to done and provides downloadUrl with correct totalBytes', async () => {
		const chunk1 = new Uint8Array([1, 2, 3])
		const chunk2 = new Uint8Array([4, 5])
		const mockGetAudio = vi.fn().mockReturnValue(makeChunkStream([chunk1, chunk2]))

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const client = makeClient(mockGetAudio) as any

		let capture: ReturnType<typeof createAudioCapturer> | undefined

		const cleanup = $effect.root(() => {
			capture = createAudioCapturer(client)
		})

		try {
			await capture!.start('wav', 3)
			flushSync()

			expect(capture!.status).toBe('done')
			expect(capture!.downloadUrl).toBeDefined()
			expect(capture!.totalBytes).toBe(chunk1.byteLength + chunk2.byteLength)
			expect(capture!.error).toBeNull()
		} finally {
			cleanup()
		}
	})

	it('error in stream sets status to error with the error message', async () => {
		const mockGetAudio = vi.fn().mockReturnValue(makeErrorStream('stream failed'))

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const client = makeClient(mockGetAudio) as any

		let capture: ReturnType<typeof createAudioCapturer> | undefined

		const cleanup = $effect.root(() => {
			capture = createAudioCapturer(client)
		})

		try {
			await capture!.start('wav', 3)
			flushSync()

			expect(capture!.status).toBe('error')
			expect(capture!.error?.message).toBe('stream failed')
		} finally {
			cleanup()
		}
	})

	it('stop aborts the stream and sets status to done without an error', async () => {
		const mockGetAudio = vi
			.fn()
			.mockImplementation(
				(
					_codec: string,
					_duration: number,
					_offset: bigint,
					_extra: unknown,
					callOptions: { signal: AbortSignal }
				) => makeAbortableStream(callOptions.signal)
			)

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const client = makeClient(mockGetAudio) as any

		let capture: ReturnType<typeof createAudioCapturer> | undefined

		const cleanup = $effect.root(() => {
			capture = createAudioCapturer(client)
		})

		try {
			const startPromise = capture!.start('wav', 0)

			// Let the stream start and yield the first chunk
			await new Promise((resolve) => setTimeout(resolve, 0))

			capture!.stop()

			await startPromise
			flushSync()

			expect(capture!.status).toBe('done')
			expect(capture!.error).toBeNull()
		} finally {
			cleanup()
		}
	})
})
