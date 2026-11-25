import { flushSync } from 'svelte'
import { describe, expect, it, vi } from 'vitest'

import { createAudioPlayer } from '../create-audio-player.svelte.ts'

type MockAudioOutClient = {
	play: ReturnType<typeof vi.fn>
}

const makeClient = (mockPlay: ReturnType<typeof vi.fn>): { current: MockAudioOutClient } => ({
	current: {
		play: mockPlay,
	},
})

describe('createAudioPlay', () => {
	it('successful play sets status to done', async () => {
		const mockPlay = vi.fn().mockResolvedValue(undefined)

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const client = makeClient(mockPlay) as any

		let playContext: ReturnType<typeof createAudioPlayer> | undefined

		const cleanup = $effect.root(() => {
			playContext = createAudioPlayer(client)
		})

		try {
			await playContext!.play(new Uint8Array([1, 2, 3]), 'wav', 48000, 1)
			flushSync()

			expect(playContext!.status).toBe('done')
			expect(playContext!.error).toBeNull()
		} finally {
			cleanup()
		}
	})

	it('failed play sets status to error with the error message', async () => {
		const mockPlay = vi.fn().mockRejectedValue(new Error('playback failed'))

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const client = makeClient(mockPlay) as any

		let playContext: ReturnType<typeof createAudioPlayer> | undefined

		const cleanup = $effect.root(() => {
			playContext = createAudioPlayer(client)
		})

		try {
			await playContext!.play(new Uint8Array([1, 2, 3]), 'wav', 48000, 1)
			flushSync()

			expect(playContext!.status).toBe('error')
			expect(playContext!.error?.message).toBe('playback failed')
		} finally {
			cleanup()
		}
	})
})
