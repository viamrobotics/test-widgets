import type { AudioOutClient } from '@viamrobotics/sdk'

import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../PlayWidget.svelte'
import Pane from './__fixtures__/In320Pane.svelte'

interface PlayState {
	properties: { supportedCodecs: string[]; sampleRateHz: number; numChannels: number } | undefined
	play: Mock<AudioOutClient['play']>
}

const state = vi.hoisted(
	(): PlayState => ({
		properties: undefined,
		play: vi.fn<AudioOutClient['play']>(),
	})
)

vi.mock('@viamrobotics/svelte-sdk', () => ({
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
		isError: false,
		error: null,
		fetchStatus: 'idle',
	})),
}))

const BYTES = new Uint8Array([1, 2, 3, 4])

const renderSubject = () =>
	render(InWidgetsProvider, {
		props: { component: Subject, props: { partID: 'test-part', resourceName: 'test-audio' } },
	})

const chooseFile = async (file: File) => {
	const input = screen.getByLabelText('Audio file')
	if (!(input instanceof HTMLInputElement)) throw new Error('The file field has no input')
	const transfer = new DataTransfer()
	transfer.items.add(file)
	input.files = transfer.files
	await fireEvent.change(input)
}

const wavFile = () => new File([BYTES], 'clip.wav', { type: 'audio/wav' })

describe('Audio output Play widget', () => {
	beforeEach(() => {
		state.properties = undefined
		state.play = vi.fn<AudioOutClient['play']>().mockResolvedValue(undefined)
	})

	it('renders the fields with Play disabled until a file is chosen', () => {
		renderSubject()

		expect(screen.getByLabelText('Audio file')).toBeInTheDocument()
		expect(screen.getByRole('combobox', { name: 'Codec' })).toHaveTextContent('pcm16')
		expect(screen.getByRole('spinbutton', { name: /Sample rate/u })).toHaveValue(48_000)
		expect(screen.getByRole('spinbutton', { name: /Channels/u })).toHaveValue(1)
		expect(screen.getByRole('button', { name: 'Play' })).toHaveAttribute('aria-disabled', 'true')
		expect(screen.getByRole('button', { name: 'Play' })).toHaveAccessibleDescription(
			'Choose an audio file first.'
		)
	})

	it('defaults the sample rate and channels to GetProperties', () => {
		state.properties = { supportedCodecs: ['pcm16'], sampleRateHz: 44_100, numChannels: 2 }

		renderSubject()

		expect(screen.getByRole('spinbutton', { name: /Sample rate/u })).toHaveValue(44_100)
		expect(screen.getByRole('spinbutton', { name: /Channels/u })).toHaveValue(2)
	})

	it('falls back to 48000 Hz and 1 channel when the device reports 0 for both', () => {
		state.properties = { supportedCodecs: ['pcm16'], sampleRateHz: 0, numChannels: 0 }

		renderSubject()

		expect(screen.getByRole('spinbutton', { name: /Sample rate/u })).toHaveValue(48_000)
		expect(screen.getByRole('spinbutton', { name: /Channels/u })).toHaveValue(1)
	})

	it('marks a file whose extension is an object key such as constructor invalid', async () => {
		renderSubject()

		await chooseFile(new File([BYTES], 'clip.constructor'))

		expect(screen.getByLabelText('Audio file')).toBeInvalid()
	})

	it('sets the codec from the picked file', async () => {
		renderSubject()

		await chooseFile(wavFile())

		expect(screen.getByRole('combobox', { name: 'Codec' })).toHaveTextContent('wav')
		expect(screen.getByRole('button', { name: 'Play' })).not.toHaveAttribute('aria-disabled')
	})

	it('marks an unsupported file invalid with the hint and disables Play', async () => {
		renderSubject()

		await chooseFile(new File([BYTES], 'notes.txt', { type: 'text/plain' }))

		expect(screen.getByLabelText('Audio file')).toBeInvalid()
		expect(
			screen.getByText('Unsupported audio format', { selector: '[role="tooltip"] *, *' })
		).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Play' })).toHaveAttribute('aria-disabled', 'true')
	})

	it('sends the file bytes with the chosen codec, sample rate, and channels', async () => {
		renderSubject()

		await chooseFile(wavFile())
		await userEvent.clear(screen.getByRole('spinbutton', { name: /Sample rate/u }))
		await userEvent.type(screen.getByRole('spinbutton', { name: /Sample rate/u }), '22050')
		await userEvent.click(screen.getByRole('button', { name: 'Play' }))

		await waitFor(() => {
			expect(state.play).toHaveBeenCalledTimes(1)
		})
		const [data, info] = state.play.mock.calls[0]!
		expect(data).toEqual(BYTES)
		expect(info).toMatchObject({ codec: 'wav', sampleRateHz: 22_050, numChannels: 1 })
	})

	it('says Play failed when the device rejects the audio', async () => {
		state.play.mockRejectedValue(new Error('speaker unplugged'))
		renderSubject()
		await chooseFile(wavFile())

		await userEvent.click(screen.getByRole('button', { name: 'Play' }))

		await waitFor(() => {
			expect(screen.getByTestId('status-line').textContent.trim()).toBe('Play failed')
		})
	})

	it('holds Play back once Sample rate is cleared', async () => {
		renderSubject()
		await chooseFile(wavFile())

		await userEvent.clear(screen.getByRole('spinbutton', { name: /Sample rate/u }))

		expect(screen.getByRole('button', { name: 'Play' })).toHaveAccessibleDescription(
			'Enter the sample rate as a whole number of at least 1.'
		)
	})

	it('is busy while playing', async () => {
		let finish: () => void = () => undefined
		state.play.mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					finish = resolve
				})
		)
		renderSubject()

		await chooseFile(wavFile())
		await userEvent.click(screen.getByRole('button', { name: 'Play' }))

		await waitFor(() => {
			expect(
				screen.getByRole('button', { name: 'Play' }).querySelector('.progress-dots'),
				'progress dots'
			).not.toBeNull()
		})
		expect(screen.getByRole('button', { name: 'Play' })).toHaveAttribute('aria-disabled', 'true')

		finish()
		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Play' })).not.toHaveAttribute('aria-disabled')
		})
		expect(
			screen.getByRole('button', { name: 'Play' }).querySelector('.progress-dots'),
			'progress dots'
		).toBeNull()
	})

	it('reports a failed Play to the indicator only', async () => {
		state.play.mockRejectedValue(new Error('speaker unavailable'))
		renderSubject()

		await chooseFile(wavFile())
		await userEvent.click(screen.getByRole('button', { name: 'Play' }))

		const indicator = await screen.findByRole('button', {
			name: 'Play: 1 error, copy to clipboard',
		})
		await fireEvent.focusIn(indicator)
		expect(screen.getByText(/speaker unavailable/iu)).toBeInTheDocument()
		expect(screen.getAllByText(/speaker unavailable/iu)).toHaveLength(1)
	})

	it('keeps the root and the pane within 320 px', () => {
		const { container } = render(Pane, { props: { widget: Subject } })

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? container
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
