import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetPropertiesWidget.svelte'

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
	AudioOutClient: class {},
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

describe('Audio output GetProperties widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetProperties section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetProperties' })).toBeInTheDocument()
	})

	it('renders the supported codecs joined by commas', () => {
		queryState.data = { supportedCodecs: ['opus', 'flac'], sampleRateHz: 44_100, numChannels: 7 }

		renderSubject()

		expect(screen.getByText('opus, flac')).toBeInTheDocument()
	})

	it('renders the sample rate in hertz', () => {
		queryState.data = { supportedCodecs: ['opus'], sampleRateHz: 44_100, numChannels: 7 }

		renderSubject()

		expect(screen.getByText('44100 Hz')).toBeInTheDocument()
	})

	it('renders the channel count', () => {
		queryState.data = { supportedCodecs: ['opus'], sampleRateHz: 44_100, numChannels: 7 }

		renderSubject()

		expect(screen.getByText('7')).toBeInTheDocument()
	})

	it('polls getProperties every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getProperties', {
			refetchInterval: 500,
		})
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
