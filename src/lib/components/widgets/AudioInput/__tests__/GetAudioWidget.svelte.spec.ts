import type { AudioChunk, AudioInClient } from '@viamrobotics/sdk'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { commonApi } from '@viamrobotics/sdk'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../GetAudioWidget.svelte'
import Pane from './__fixtures__/In320Pane.svelte'

const state = vi.hoisted(() => ({
	properties: undefined as { supportedCodecs: string[] } | undefined,
	getAudio: undefined as unknown as Mock<AudioInClient['getAudio']>,
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({
		current: {
			callOptions: {},
			getAudio: (...args: Parameters<AudioInClient['getAudio']>) => state.getAudio(...args),
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

const makeChunk = (audioData: Uint8Array, overrides: Partial<AudioChunk> = {}): AudioChunk => ({
	audioData,
	startTimeNs: 0n,
	endTimeNs: 0n,
	sequence: 0,
	requestID: '',
	...overrides,
})

async function* twoChunks() {
	const audioInfo = new commonApi.AudioInfo({
		codec: 'pcm16',
		sampleRateHz: 48_000,
		numChannels: 2,
	})
	yield makeChunk(new Uint8Array(1024), { audioInfo, endTimeNs: 111n })
	yield makeChunk(new Uint8Array(1024), { audioInfo, endTimeNs: 222n })
}

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-audio' } })

describe('Audio input GetAudio widget', () => {
	beforeEach(() => {
		state.properties = undefined
		state.getAudio = vi.fn<AudioInClient['getAudio']>(() => twoChunks())
	})

	it('renders the Codec, Duration and Previous timestamp fields', () => {
		renderSubject()

		expect(screen.getByRole('combobox', { name: 'Codec' })).toBeInTheDocument()
		expect(screen.getByRole('spinbutton', { name: /Duration/u })).toHaveValue(3)
		expect(screen.getByRole('textbox', { name: /Previous timestamp/u })).toHaveValue('')
		expect(screen.getByRole('button', { name: 'Start capture' })).toBeEnabled()
	})

	it('offers pcm16 when GetProperties lists no codecs', () => {
		renderSubject()

		expect(screen.getByRole('combobox', { name: 'Codec' })).toHaveTextContent('pcm16')
	})

	it('selects the first supported codec', () => {
		state.properties = { supportedCodecs: ['flac', 'wav'] }

		renderSubject()

		expect(screen.getByRole('combobox', { name: 'Codec' })).toHaveTextContent('flac')
	})

	it('marks an unparsable previous timestamp invalid and holds Start back', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: /Previous timestamp/u }), '12x')

		expect(screen.getByRole('textbox', { name: /Previous timestamp/u })).toBeInvalid()
		expect(screen.getByRole('button', { name: 'Start capture' })).toHaveAttribute(
			'aria-disabled',
			'true'
		)
		expect(screen.getByRole('button', { name: 'Start capture' })).toHaveAccessibleDescription(
			'Enter the previous timestamp as whole nanoseconds.'
		)
	})

	it('requests no audio when Start is pressed while held back', async () => {
		renderSubject()
		await userEvent.type(screen.getByRole('textbox', { name: /Previous timestamp/u }), '12x')

		await userEvent.click(screen.getByRole('button', { name: 'Start capture' }))

		expect(state.getAudio).not.toHaveBeenCalled()
	})

	it('holds Start back once Duration is cleared', async () => {
		renderSubject()

		await userEvent.clear(screen.getByRole('spinbutton', { name: /Duration/u }))

		expect(screen.getByRole('button', { name: 'Start capture' })).toHaveAccessibleDescription(
			'Enter a duration of 0 or more.'
		)
	})

	it("shows the last chunk's sequence, size, request ID and timestamps", async () => {
		state.getAudio = vi.fn<AudioInClient['getAudio']>(() =>
			(async function* () {
				yield makeChunk(new Uint8Array(512), {
					sequence: 7,
					requestID: 'request-1',
					startTimeNs: 100n,
					endTimeNs: 200n,
				})
			})()
		)
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Start capture' }))

		const lastChunk = await screen.findByRole('group', { name: 'Last chunk' })
		await expect
			.poll(() => lastChunk.textContent.replaceAll(/\s+/gu, ' ').trim())
			.toBe(
				'Last chunk Sequence 7 Size 512 B Request ID request-1 Start timestamp 100 ns End timestamp 200 ns'
			)
	})

	it('says the capture failed when the stream throws', async () => {
		state.getAudio = vi.fn<AudioInClient['getAudio']>(() =>
			(async function* () {
				yield await Promise.reject<AudioChunk>(new Error('device unplugged'))
			})()
		)
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Start capture' }))

		await expect
			.poll(() => screen.getByTestId('status-line').textContent.trim())
			.toBe('Capture failed')
	})

	it('streams a capture, shows its readouts and offers Download', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: /Previous timestamp/u }), '99')
		await userEvent.click(screen.getByRole('button', { name: 'Start capture' }))

		expect(await screen.findByRole('link', { name: 'Download' })).toHaveAttribute(
			'download',
			'audio-capture.pcm16'
		)
		expect(state.getAudio.mock.calls[0]!.slice(0, 3)).toEqual(['pcm16', 3, 99n])
		expect(screen.getByText('2.0')).toBeInTheDocument()
		expect(screen.getByText('KB')).toBeInTheDocument()
		expect(screen.getByText('48000')).toBeInTheDocument()
		expect(screen.getByText('Hz')).toBeInTheDocument()
		expect(screen.getByText('222')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Copy end timestamp' })).toBeInTheDocument()
	})

	it('becomes Stop while streaming', async () => {
		state.getAudio = vi.fn<AudioInClient['getAudio']>(
			(_codec, _duration, _timestamp, _extra, options) =>
				(async function* () {
					yield makeChunk(new Uint8Array(1))
					await new Promise<never>((_, reject) => {
						options?.signal?.addEventListener('abort', () => reject(options.signal?.reason))
					})
				})()
		)
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Start capture' }))
		await userEvent.click(await screen.findByRole('button', { name: 'Stop' }))

		expect(await screen.findByRole('button', { name: 'Start capture' })).toBeInTheDocument()
	})

	it('keeps the root and the pane within 320 px', () => {
		const { container } = render(Pane, { props: { widget: Subject } })

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? container
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
