import { AudioOutClient, commonApi } from '@viamrobotics/sdk'

type PlayStatus = 'idle' | 'playing' | 'done' | 'error'

export const createAudioPlayer = (client: { current: AudioOutClient | undefined }) => {
	let playStatus = $state<PlayStatus>('idle')
	let playError = $state<Error | null>(null)

	const play = async (
		audioData: Uint8Array,
		codec: string,
		sampleRateHz: number,
		numChannels: number
	) => {
		if (!client.current) return

		playStatus = 'playing'
		playError = null

		try {
			await client.current.play(
				audioData,
				commonApi.AudioInfo.fromJson({ codec, sampleRateHz, numChannels }),
				{}
			)
			playStatus = 'done'
		} catch (error) {
			playStatus = 'error'
			playError = error instanceof Error ? error : new Error(String(error))
		}
	}

	return {
		get status() {
			return playStatus
		},
		get error() {
			return playError
		},
		play,
	}
}
