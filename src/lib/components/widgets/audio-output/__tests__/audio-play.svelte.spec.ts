import type { AudioOutClient } from '@viamrobotics/sdk'

import { flushSync } from 'svelte'
import { describe, expect, it, vi } from 'vitest'

import { createAudioPlayer } from '../create-audio-player.svelte.ts'

const makePlayer = (play: AudioOutClient['play']) => {
	let player: ReturnType<typeof createAudioPlayer> | undefined
	const cleanup = $effect.root(() => {
		player = createAudioPlayer({ current: { play } })
	})
	if (player === undefined) throw new Error('The player was not created')
	return { player, cleanup }
}

describe('createAudioPlayer', () => {
	it('successful play sets status to done', async () => {
		const { player, cleanup } = makePlayer(
			vi.fn<AudioOutClient['play']>().mockResolvedValue(undefined)
		)

		try {
			await player.play(new Uint8Array([1, 2, 3]), 'wav', 48_000, 1)
			flushSync()

			expect(player.status).toBe('done')
			expect(player.error).toBeNull()
		} finally {
			cleanup()
		}
	})

	it('sends the bytes with the codec, sample rate, and channels', async () => {
		const play = vi.fn<AudioOutClient['play']>().mockResolvedValue(undefined)
		const { player, cleanup } = makePlayer(play)

		try {
			await player.play(new Uint8Array([1, 2, 3]), 'flac', 44_100, 2)

			const [data, info] = play.mock.calls[0]!
			expect(data).toEqual(new Uint8Array([1, 2, 3]))
			expect(info).toMatchObject({ codec: 'flac', sampleRateHz: 44_100, numChannels: 2 })
		} finally {
			cleanup()
		}
	})

	it('failed play sets status to error with the error message', async () => {
		const { player, cleanup } = makePlayer(
			vi.fn<AudioOutClient['play']>().mockRejectedValue(new Error('playback failed'))
		)

		try {
			await player.play(new Uint8Array([1, 2, 3]), 'wav', 48_000, 1)
			flushSync()

			expect(player.status).toBe('error')
			expect(player.error?.message).toBe('playback failed')
		} finally {
			cleanup()
		}
	})
})
