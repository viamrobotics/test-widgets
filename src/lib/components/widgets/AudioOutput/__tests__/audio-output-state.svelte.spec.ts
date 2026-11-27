import type { AudioOutClient } from '@viamrobotics/sdk'

import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import PlayStream from '../PlayStreamWidget.svelte'
import Play from '../PlayWidget.svelte'

interface OutputState {
	play: Mock<AudioOutClient['play']>
	playStream: Mock<AudioOutClient['playStream']>
}

const state = vi.hoisted(
	(): OutputState => ({
		play: vi.fn<AudioOutClient['play']>(),
		playStream: vi.fn<AudioOutClient['playStream']>(),
	})
)

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({
		current: {
			play: (...args: Parameters<AudioOutClient['play']>) => state.play(...args),
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

const PROPS = { partID: 'test-part', resourceName: 'test-audio' }

const chooseFile = async () => {
	const input = screen.getByLabelText('Audio file')
	if (!(input instanceof HTMLInputElement)) throw new Error('The file field has no input')
	const transfer = new DataTransfer()
	transfer.items.add(new File([new Uint8Array([1, 2, 3, 4])], 'clip.wav', { type: 'audio/wav' }))
	input.files = transfer.files
	await fireEvent.change(input)
}

const holdOpenUntilReleased = () => {
	const release: { current: () => void } = { current: () => undefined }
	const pending = new Promise<void>((resolve) => {
		release.current = resolve
	})
	return { pending, release }
}

describe('Audio output widgets sharing one WidgetsProvider', () => {
	beforeEach(() => {
		state.play = vi.fn<AudioOutClient['play']>().mockResolvedValue(undefined)
		state.playStream = vi.fn<AudioOutClient['playStream']>().mockResolvedValue(undefined)
		vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockReturnValue(
			new Promise<MediaStream>(() => undefined)
		)
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('disables Start stream while a Play is in flight', async () => {
		const held = holdOpenUntilReleased()
		state.play.mockReturnValue(held.pending)
		render(InWidgetsProvider, { props: { component: [Play, PlayStream], props: PROPS } })
		expect(screen.getByRole('button', { name: 'Start stream' })).not.toHaveAttribute(
			'aria-disabled'
		)

		await chooseFile()
		await userEvent.click(screen.getByRole('button', { name: 'Play' }))

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Start stream' })).toHaveAttribute(
				'aria-disabled',
				'true'
			)
		})
		expect(state.playStream).not.toHaveBeenCalled()

		held.release.current()

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Start stream' })).not.toHaveAttribute(
				'aria-disabled'
			)
		})
	})

	it('disables Play while a stream is running, and frees it when the stream stops', async () => {
		const held = holdOpenUntilReleased()
		state.playStream.mockReturnValue(held.pending)
		render(InWidgetsProvider, { props: { component: [Play, PlayStream], props: PROPS } })
		await chooseFile()
		expect(screen.getByRole('button', { name: 'Play' })).not.toHaveAttribute('aria-disabled')

		await userEvent.click(screen.getByRole('button', { name: 'Start stream' }))

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Play' })).toHaveAttribute('aria-disabled', 'true')
		})
		expect(screen.getByRole('button', { name: 'Stop' })).not.toHaveAttribute('aria-disabled')

		await userEvent.click(screen.getByRole('button', { name: 'Stop' }))

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Play' })).not.toHaveAttribute('aria-disabled')
		})
	})

	it('shares no group across two audio outputs', async () => {
		const held = holdOpenUntilReleased()
		state.play.mockReturnValue(held.pending)
		render(InWidgetsProvider, { props: { component: [Play, PlayStream], props: PROPS } })
		render(InWidgetsProvider, {
			props: { component: PlayStream, props: { ...PROPS, resourceName: 'other-audio' } },
		})

		await chooseFile()
		await userEvent.click(screen.getByRole('button', { name: 'Play' }))

		await waitFor(() => {
			expect(screen.getAllByRole('button', { name: 'Start stream' })[0]).toHaveAttribute(
				'aria-disabled',
				'true'
			)
		})
		expect(screen.getAllByRole('button', { name: 'Start stream' })[1]).not.toHaveAttribute(
			'aria-disabled'
		)
	})
})
