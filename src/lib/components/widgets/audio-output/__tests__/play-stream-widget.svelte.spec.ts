import type { AudioOutClient } from '@viamrobotics/sdk'

import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../play-stream-widget.svelte'
import Pane from './__fixtures__/in-320-pane.svelte'

interface StreamCall {
	received: Uint8Array[]
	isEnded: boolean
}

interface StreamState {
	playStream: Mock<AudioOutClient['playStream']>
	calls: StreamCall[]
}

const state = vi.hoisted(
	(): StreamState => ({
		playStream: vi.fn<AudioOutClient['playStream']>(),
		calls: [],
	})
)

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({
		current: {
			playStream: (...args: Parameters<AudioOutClient['playStream']>) => state.playStream(...args),
		},
	})),
	createResourceQuery: vi.fn(() => ({
		data: undefined,
		isLoading: false,
		isError: false,
		error: null,
		fetchStatus: 'idle',
	})),
}))

const BYTES = new Uint8Array([1, 2, 3, 4])

const collectChunks: AudioOutClient['playStream'] = async (_info, chunks) => {
	const call: StreamCall = { received: [], isEnded: false }
	state.calls.push(call)
	for await (const chunk of chunks) call.received.push(chunk)
	call.isEnded = true
}

const holdMicrophoneOpen = () => {
	vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockReturnValue(
		new Promise<MediaStream>(() => undefined)
	)
}

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-audio' } })

const chooseFile = async (file: File) => {
	await userEvent.click(screen.getByRole('radio', { name: 'File' }))
	const input = screen.getByLabelText('Audio file')
	if (!(input instanceof HTMLInputElement)) throw new Error('The file field has no input')
	const transfer = new DataTransfer()
	transfer.items.add(file)
	input.files = transfer.files
	await fireEvent.change(input)
}

const wavFile = () => new File([BYTES], 'clip.wav', { type: 'audio/wav' })

describe('AudioOutput PlayStream widget', () => {
	beforeEach(() => {
		state.calls = []
		state.playStream = vi.fn<AudioOutClient['playStream']>(collectChunks)
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('renders the heading and the fields with Start stream enabled on the microphone', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'PlayStream' })).toBeInTheDocument()
		expect(screen.getByRole('radio', { name: 'Microphone' })).toBeChecked()
		expect(screen.getByRole('combobox', { name: 'Codec' })).toHaveTextContent('pcm16')
		expect(screen.getByRole('spinbutton', { name: /Sample rate/u })).toHaveValue(48_000)
		expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled()
	})

	it('streams a file to playStream with its AudioInfo and chunks', async () => {
		renderSubject()

		await chooseFile(wavFile())
		await userEvent.click(screen.getByRole('button', { name: 'Start stream' }))

		await waitFor(() => {
			expect(state.playStream).toHaveBeenCalledTimes(1)
			expect(state.calls[0]?.isEnded).toBe(true)
		})
		const [info] = state.playStream.mock.calls[0]!
		expect(info).toMatchObject({ codec: 'wav', sampleRateHz: 48_000, numChannels: 1 })
		expect(state.calls[0]?.received).toEqual([BYTES])
		expect(screen.getByRole('group', { name: 'Sent' })).toHaveTextContent('Sent 0 KB')
	})

	it('ends the stream on Stop', async () => {
		holdMicrophoneOpen()
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Start stream' }))
		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled()
		})
		expect(state.calls[0]?.isEnded).toBe(false)
		await userEvent.click(screen.getByRole('button', { name: 'Stop' }))

		await waitFor(() => {
			expect(state.calls[0]?.isEnded).toBe(true)
		})
		expect(screen.getByRole('button', { name: 'Start stream' })).toBeEnabled()
		expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled()
	})

	it('ends the stream on unmount', async () => {
		holdMicrophoneOpen()
		const { unmount } = renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Start stream' }))
		await waitFor(() => {
			expect(state.calls).toHaveLength(1)
		})
		expect(state.calls[0]?.isEnded).toBe(false)
		unmount()

		await waitFor(() => {
			expect(state.calls[0]?.isEnded).toBe(true)
		})
	})

	it('gives a stream started after a stopped one only its own chunks', async () => {
		holdMicrophoneOpen()
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Start stream' }))
		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled()
		})
		await userEvent.click(screen.getByRole('button', { name: 'Stop' }))
		await waitFor(() => {
			expect(state.calls[0]?.isEnded).toBe(true)
		})
		await chooseFile(wavFile())
		await userEvent.click(screen.getByRole('button', { name: 'Start stream' }))

		await waitFor(() => {
			expect(state.calls[1]?.isEnded).toBe(true)
		})
		expect(state.calls[0]?.received).toEqual([])
		expect(state.calls[1]?.received).toEqual([BYTES])
	})

	it('leaves the status done when a stopped stream rejects afterwards', async () => {
		holdMicrophoneOpen()
		let rejectCall: (reason: Error) => void = () => undefined
		state.playStream = vi.fn<AudioOutClient['playStream']>(
			() =>
				new Promise<void>((_resolve, reject) => {
					rejectCall = reject
				})
		)
		renderSubject()
		await userEvent.click(screen.getByRole('button', { name: 'Start stream' }))
		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled()
		})
		await userEvent.click(screen.getByRole('button', { name: 'Stop' }))

		rejectCall(new Error('stream aborted'))
		await new Promise((resolve) => {
			setTimeout(resolve, 50)
		})

		expect(screen.queryByRole('button', { name: /PlayStream: 1 error/u })).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Start stream' })).toBeEnabled()
	})

	it('starts no stream when the widget unmounts during the file read', async () => {
		let releaseRead: () => void = () => undefined
		const file = wavFile()
		vi.spyOn(file, 'arrayBuffer').mockReturnValue(
			new Promise<ArrayBuffer>((resolve) => {
				releaseRead = () => {
					resolve(BYTES.buffer)
				}
			})
		)
		const { unmount } = renderSubject()
		await chooseFile(file)
		await userEvent.click(screen.getByRole('button', { name: 'Start stream' }))

		unmount()
		releaseRead()
		await new Promise((resolve) => {
			setTimeout(resolve, 50)
		})

		expect(state.playStream).not.toHaveBeenCalled()
	})

	it('shows the unsupported file message once', async () => {
		renderSubject()

		await chooseFile(new File([BYTES], 'notes.txt', { type: 'text/plain' }))

		expect(screen.getAllByText('Unsupported audio format')).toHaveLength(1)
		expect(screen.getByLabelText('Audio file')).toHaveAccessibleDescription(
			'Unsupported audio format'
		)
	})

	it('shows the count message once for an invalid channel count', async () => {
		renderSubject()

		await userEvent.clear(screen.getByRole('spinbutton', { name: /Channels/u }))

		const message = 'Sample rate and channels must be whole numbers of at least 1'
		expect(screen.getAllByText(message)).toHaveLength(1)
		expect(screen.getByRole('spinbutton', { name: /Channels/u })).toHaveAccessibleDescription(
			message
		)
	})

	it('disables Start stream with the message for an unsupported file', async () => {
		renderSubject()

		await chooseFile(new File([BYTES], 'notes.txt', { type: 'text/plain' }))

		const start = screen.getByRole('button', { name: 'Start stream' })
		expect(start).toBeDisabled()
		expect(screen.getByLabelText('Audio file')).toBeInvalid()
		expect(start).toHaveAccessibleDescription(expect.stringContaining('Unsupported audio format'))
	})

	it('disables Start stream with the message for an invalid sample rate', async () => {
		renderSubject()

		await userEvent.clear(screen.getByRole('spinbutton', { name: /Sample rate/u }))

		const start = screen.getByRole('button', { name: 'Start stream' })
		expect(start).toBeDisabled()
		expect(screen.getByRole('spinbutton', { name: /Sample rate/u })).toBeInvalid()
		expect(start).toHaveAccessibleDescription(
			expect.stringContaining('Sample rate and channels must be whole numbers of at least 1')
		)
	})

	it('reports a failed stream to the indicator only', async () => {
		state.playStream = vi.fn<AudioOutClient['playStream']>().mockRejectedValue(new Error('no sink'))
		renderSubject()

		await chooseFile(wavFile())
		await userEvent.click(screen.getByRole('button', { name: 'Start stream' }))

		const indicator = await screen.findByRole('button', {
			name: 'PlayStream: 1 error, copy to clipboard',
		})
		await fireEvent.focusIn(indicator)
		expect(screen.getAllByText(/no sink/iu)).toHaveLength(1)
	})
})

describe('AudioOutput PlayStream widget in a 320 px pane', () => {
	it('keeps the root and the pane within 320 px', () => {
		const { container } = render(Pane, { props: { widget: Subject } })

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? container
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
