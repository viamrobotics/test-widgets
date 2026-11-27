import { fireEvent, render, screen, within } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetPropertiesWidget.svelte'
import Pane from './__fixtures__/In320Pane.svelte'

interface Properties {
	supportedCodecs: string[]
	sampleRateHz: number
	numChannels: number
}

const { queryState } = vi.hoisted(() => {
	const state: { data: Properties | undefined; error: Error | null } = {
		data: undefined,
		error: null,
	}
	return { queryState: state }
})

vi.mock('@viamrobotics/sdk', () => ({
	AudioInClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: queryState.data,
		isLoading: queryState.data === undefined && queryState.error === null,
		isError: queryState.error !== null,
		error: queryState.error,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-audio' },
	})

describe('Audio input GetProperties widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetProperties section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetProperties' })).toBeInTheDocument()
	})

	it('lists each supported codec', () => {
		queryState.data = { supportedCodecs: ['opus', 'flac'], sampleRateHz: 44_100, numChannels: 7 }

		renderSubject()

		const codecs = within(screen.getByRole('list', { name: 'Supported codecs' })).getAllByRole(
			'listitem'
		)
		expect(codecs.map((codec) => codec.textContent.trim())).toEqual(['opus', 'flac'])
	})

	it('renders the sample rate in hertz', () => {
		queryState.data = { supportedCodecs: ['opus'], sampleRateHz: 44_100, numChannels: 7 }

		renderSubject()

		expect(screen.getByText('44100')).toBeInTheDocument()
		expect(screen.getByText('Hz')).toBeInTheDocument()
	})

	it('renders the channel count', () => {
		queryState.data = { supportedCodecs: ['opus'], sampleRateHz: 44_100, numChannels: 7 }

		renderSubject()

		expect(screen.getByText('7')).toBeInTheDocument()
	})

	it('reads getProperties once, with no polling', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getProperties', {
			refetchInterval: false,
		})
	})

	it('reads - for no codecs', () => {
		queryState.data = { supportedCodecs: [], sampleRateHz: 44_100, numChannels: 7 }

		renderSubject()

		expect(screen.getByRole('group', { name: 'Supported codecs' }).textContent.trim()).toBe('-')
	})

	it('keeps the root and the pane within 320 px', () => {
		const { container } = render(Pane, { props: { widget: Subject } })

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? container
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('properties unavailable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetProperties: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/properties unavailable/iu)).toBeInTheDocument()
	})
})
