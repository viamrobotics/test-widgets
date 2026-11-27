import type { AudioOutClient } from '@viamrobotics/sdk'

import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../PlayFileControl.svelte'
import Play from '../PlayWidget.svelte'

interface PlayFileState {
	properties: { supportedCodecs: string[]; sampleRateHz: number; numChannels: number } | undefined
	play: Mock<AudioOutClient['play']>
}

const state = vi.hoisted(
	(): PlayFileState => ({
		properties: undefined,
		play: vi.fn<AudioOutClient['play']>(),
	})
)

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({
			current: {
				play: (...args: Parameters<AudioOutClient['play']>) => state.play(...args),
			},
		})),
		createResourceQuery: vi.fn(() => ({
			get data() {
				return state.properties
			},
			isLoading: false,
			isSuccess: true,
			isError: false,
			fetchStatus: 'idle',
			error: null,
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const PROPS = { partID: 'test-part', resourceName: 'test-audio-out' }
const DEVICE_SAMPLE_RATE_HZ = 16_000
const WAV_BYTES = new Uint8Array([1, 2, 3, 4])

let user: ReturnType<typeof userEvent.setup>

beforeEach(() => {
	state.properties = {
		supportedCodecs: ['pcm16', 'wav'],
		sampleRateHz: DEVICE_SAMPLE_RATE_HZ,
		numChannels: 2,
	}
	state.play = vi.fn<AudioOutClient['play']>().mockResolvedValue(undefined)
	user = userEvent.setup()
})

const renderSubject = () =>
	render(InWidgetsProvider, { props: { component: Subject, props: PROPS } })

const renderWithPlay = () =>
	render(InWidgetsProvider, { props: { component: [Subject, Play], props: PROPS } })

const playButton = () => screen.getByRole('button', { name: 'Play' })

const wavFile = () => new File([WAV_BYTES], 'greeting.wav', { type: 'audio/wav' })

const chooseFileAt = async (file: File, index: number) => {
	const input = screen.getAllByLabelText('Audio file')[index]
	if (!(input instanceof HTMLInputElement)) throw new Error('The file field has no input')
	const transfer = new DataTransfer()
	transfer.items.add(file)
	input.files = transfer.files
	await fireEvent.change(input)
}

const chooseFile = (file: File) => chooseFileAt(file, 0)

const sentClip = () => {
	const [call] = state.play.mock.calls
	if (call === undefined) throw new Error('Play was not called')
	const [audioData, info] = call
	return { audioData, info }
}

describe('PlayFile', () => {
	it('is headed Play a file', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Play a file' })).toBeInTheDocument()
	})

	it('plays a chosen file through Play with its codec and GetProperties’ format', async () => {
		renderSubject()
		await chooseFile(wavFile())

		await user.click(playButton())

		await vi.waitFor(() => expect(state.play).toHaveBeenCalledTimes(1))
		const { audioData, info } = sentClip()
		expect([...audioData]).toEqual([...WAV_BYTES])
		expect(info).toEqual(
			expect.objectContaining({
				codec: 'wav',
				sampleRateHz: DEVICE_SAMPLE_RATE_HZ,
				numChannels: 2,
			})
		)
	})

	it('keeps Play disabled with no file', () => {
		renderSubject()

		expect(playButton()).toHaveAttribute('aria-disabled', 'true')
	})

	it('marks an unsupported file invalid and keeps Play disabled', async () => {
		renderSubject()

		await chooseFile(new File([WAV_BYTES], 'notes.txt', { type: 'text/plain' }))

		expect(screen.getByLabelText('Audio file')).toHaveAttribute('aria-invalid', 'true')
		expect(playButton()).toHaveAttribute('aria-disabled', 'true')
	})

	it("shows an unsupported file's message as the file field's tooltip", async () => {
		renderSubject()
		await chooseFile(new File([WAV_BYTES], 'notes.txt', { type: 'text/plain' }))

		screen.getByRole('button', { name: 'About Audio file' }).focus()

		expect(
			await screen.findByRole('tooltip', { name: 'Unsupported audio format' })
		).toBeInTheDocument()
		expect(screen.getByLabelText('Audio file')).toHaveAccessibleDescription(
			'Unsupported audio format'
		)
	})

	it('draws no tooltip on the file field for a supported file', async () => {
		renderSubject()

		await chooseFile(wavFile())

		expect(screen.queryByRole('button', { name: 'About Audio file' })).not.toBeInTheDocument()
	})

	it('writes Play failed to the status line when Play rejects', async () => {
		state.play.mockRejectedValue(new Error('no sink'))
		renderSubject()
		await chooseFile(wavFile())

		await user.click(playButton())

		await vi.waitFor(() =>
			expect(screen.getByTestId('status-line')).toHaveTextContent('Play failed')
		)
	})

	it('writes Play failed to the status line when the file read rejects', async () => {
		const file = wavFile()
		vi.spyOn(file, 'arrayBuffer').mockRejectedValue(new Error('unreadable'))
		renderSubject()
		await chooseFile(file)

		await user.click(playButton())

		await vi.waitFor(() =>
			expect(screen.getByTestId('status-line')).toHaveTextContent('Play failed')
		)
		expect(state.play).not.toHaveBeenCalled()
	})

	it('ignores a press of Play while a file plays', async () => {
		state.play.mockReturnValue(new Promise(() => undefined))
		renderSubject()
		await chooseFile(wavFile())
		await user.click(playButton())
		await vi.waitFor(() =>
			expect(playButton().querySelector('.progress-dots'), 'progress dots').not.toBeNull()
		)

		await user.click(playButton())

		expect(state.play).toHaveBeenCalledTimes(1)
	})

	it('shares the playback group with Play, so a clip in flight there disables PlayFile', async () => {
		state.play.mockReturnValue(new Promise(() => undefined))
		renderWithPlay()
		await chooseFileAt(wavFile(), 0)
		await chooseFileAt(wavFile(), 1)
		const [fileButton, playWidgetButton] = screen.getAllByRole('button', { name: 'Play' })

		await user.click(playWidgetButton!)

		await vi.waitFor(() => expect(fileButton).toHaveAttribute('aria-disabled', 'true'))
		await user.click(fileButton!)
		expect(state.play).toHaveBeenCalledTimes(1)
	})

	it('shares the playback group with Play, so a file in flight disables Play', async () => {
		state.play.mockReturnValue(new Promise(() => undefined))
		renderWithPlay()
		await chooseFileAt(wavFile(), 0)
		await chooseFileAt(wavFile(), 1)
		const [fileButton, playWidgetButton] = screen.getAllByRole('button', { name: 'Play' })

		await user.click(fileButton!)

		await vi.waitFor(() => expect(playWidgetButton).toHaveAttribute('aria-disabled', 'true'))
	})
})
