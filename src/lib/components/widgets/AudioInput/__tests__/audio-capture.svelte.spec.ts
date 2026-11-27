import type { AudioChunk, AudioInClient } from '@viamrobotics/sdk'

import { commonApi } from '@viamrobotics/sdk'
import { flushSync } from 'svelte'
import { describe, expect, it, type Mock, vi } from 'vitest'

import { createAudioCapturer } from '../create-audio-capturer.svelte.ts'

type MockAudioInClient = Pick<AudioInClient, 'getAudio' | 'callOptions'>

const makeClient = (
	mockGetAudio: Mock<AudioInClient['getAudio']>
): { current: MockAudioInClient } => ({
	current: {
		callOptions: {},
		getAudio: mockGetAudio,
	},
})

const makeChunk = (audioData: Uint8Array, overrides: Partial<AudioChunk> = {}): AudioChunk => ({
	audioData,
	startTimeNs: 0n,
	endTimeNs: 0n,
	sequence: 0,
	requestID: '',
	...overrides,
})

async function* makeChunkStream(chunks: Uint8Array[]) {
	for (const [index, chunk] of chunks.entries()) {
		yield makeChunk(chunk, {
			audioInfo:
				index === 0
					? new commonApi.AudioInfo({ codec: 'wav', sampleRateHz: 48_000, numChannels: 2 })
					: new commonApi.AudioInfo({ codec: 'other', sampleRateHz: 1, numChannels: 1 }),
			endTimeNs: BigInt((index + 1) * 1000),
		})
	}
}

async function* makeErrorStream(message: string) {
	yield makeChunk(new Uint8Array([1]))
	throw new Error(message)
}

async function* makeAbortableStream(signal: AbortSignal | undefined) {
	yield makeChunk(new Uint8Array([1, 2, 3]))
	await new Promise<never>((_, reject) => {
		signal?.addEventListener('abort', () => reject(signal?.reason))
	})
}

describe('createAudioCapture', () => {
	it('successful capture sets status to done and provides downloadUrl with correct totalBytes', async () => {
		const chunk1 = new Uint8Array([1, 2, 3])
		const chunk2 = new Uint8Array([4, 5])
		const mockGetAudio = vi
			.fn<AudioInClient['getAudio']>()
			.mockReturnValue(makeChunkStream([chunk1, chunk2]))

		const client = makeClient(mockGetAudio)

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

	it('tracks the chunk count, the first chunk info and the last end timestamp', async () => {
		const mockGetAudio = vi
			.fn<AudioInClient['getAudio']>()
			.mockReturnValue(
				makeChunkStream([new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])])
			)

		const client = makeClient(mockGetAudio)

		let capture: ReturnType<typeof createAudioCapturer> | undefined

		const cleanup = $effect.root(() => {
			capture = createAudioCapturer(client)
		})

		try {
			await capture!.start('wav', 3, 42n)
			flushSync()

			expect(capture!.chunkCount).toBe(3)
			expect(capture!.audioInfo).toEqual({ codec: 'wav', sampleRateHz: 48_000, numChannels: 2 })
			expect(capture!.lastChunk?.endTimeNs).toBe(3000n)
			expect(mockGetAudio.mock.calls[0]![2]).toBe(42n)
		} finally {
			cleanup()
		}
	})

	it('sends a previous timestamp of 0 when none is given', async () => {
		const mockGetAudio = vi
			.fn<AudioInClient['getAudio']>()
			.mockReturnValue(makeChunkStream([new Uint8Array([1])]))

		const client = makeClient(mockGetAudio)

		let capture: ReturnType<typeof createAudioCapturer> | undefined

		const cleanup = $effect.root(() => {
			capture = createAudioCapturer(client)
		})

		try {
			await capture!.start('wav', 3)

			expect(mockGetAudio.mock.calls[0]![2]).toBe(0n)
		} finally {
			cleanup()
		}
	})

	it('error in stream sets status to error with the error message', async () => {
		const mockGetAudio = vi
			.fn<AudioInClient['getAudio']>()
			.mockReturnValue(makeErrorStream('stream failed'))

		const client = makeClient(mockGetAudio)

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
			.fn<AudioInClient['getAudio']>()
			.mockImplementation((_codec, _duration, _offset, _extra, callOptions) =>
				makeAbortableStream(callOptions?.signal)
			)

		const client = makeClient(mockGetAudio)

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

	it('ends the stream and builds no download when torn down mid-capture', async () => {
		const mockGetAudio = vi.fn<AudioInClient['getAudio']>(
			(_codec, _duration, _timestamp, _extra, options) => makeAbortableStream(options?.signal)
		)
		let capture: ReturnType<typeof createAudioCapturer> | undefined
		const cleanup = $effect.root(() => {
			capture = createAudioCapturer(makeClient(mockGetAudio))
		})
		const running = capture!.start('wav', 0)
		await vi.waitFor(() => {
			expect(capture!.chunkCount).toBe(1)
		})

		cleanup()
		await running

		expect(mockGetAudio.mock.calls[0]![4]?.signal?.aborted).toBe(true)
		expect(capture!.downloadUrl).toBeUndefined()
	})

	it('drops a second start while a capture is in flight', async () => {
		const mockGetAudio = vi.fn<AudioInClient['getAudio']>(
			(_codec, _duration, _timestamp, _extra, options) => makeAbortableStream(options?.signal)
		)
		let capture: ReturnType<typeof createAudioCapturer> | undefined
		const cleanup = $effect.root(() => {
			capture = createAudioCapturer(makeClient(mockGetAudio))
		})

		try {
			const running = capture!.start('wav', 0)
			await capture!.start('mp3', 0)
			capture!.stop()
			await running

			expect(mockGetAudio).toHaveBeenCalledOnce()
			expect(capture!.codec).toBe('wav')
		} finally {
			cleanup()
		}
	})
})
