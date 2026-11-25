import { fireEvent, render, screen } from '@testing-library/svelte'
import {
	type RefetchInterval,
	RefetchIntervals,
} from '#lib/components/refetch-interval-store.svelte.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../metadata-widget.svelte'

interface PollingOptions {
	refetchInterval: number | false
}

interface MetadataFixture {
	name: string
	description: string
	type: string
	inputInfo: never[]
	outputInfo: never[]
}

const { queryState, requestedOptions } = vi.hoisted(() => {
	const state: { data: { metadata: MetadataFixture } | undefined; error: Error | null } = {
		data: undefined,
		error: null,
	}
	const options: (() => PollingOptions)[] = []
	return { queryState: state, requestedOptions: options }
})

vi.mock('@viamrobotics/sdk', () => ({
	MLModelClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, _method: string, options: () => PollingOptions) => {
		requestedOptions.push(options)
		return {
			data: queryState.data,
			isLoading: queryState.data === undefined && queryState.error === null,
			isError: queryState.error !== null,
			error: queryState.error,
		}
	}),
}))

const renderSubject = (refetchInterval?: RefetchInterval) =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-ml-model', refetchInterval },
	})

describe('ML model Metadata widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		requestedOptions.length = 0
	})

	it('renders the Metadata section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Metadata' })).toBeInTheDocument()
	})

	it('renders the model name from the metadata', () => {
		queryState.data = {
			metadata: { name: 'resnet-50', description: '', type: '', inputInfo: [], outputInfo: [] },
		}

		renderSubject()

		expect(screen.getByText('resnet-50')).toBeInTheDocument()
	})

	it.each([
		{
			behavior: 'polls once a second when given no rate',
			refetchInterval: undefined,
			expected: 1000,
		},
		{
			behavior: 'slows the live rate to once a second',
			refetchInterval: RefetchIntervals.LIVE,
			expected: 1000,
		},
		{
			behavior: 'keeps a rate slower than once a second',
			refetchInterval: RefetchIntervals.FIVE_SEC,
			expected: 5000,
		},
		{
			behavior: 'does not poll on manual refresh',
			refetchInterval: RefetchIntervals.MANUAL,
			expected: false,
		},
	])('$behavior', ({ refetchInterval, expected }) => {
		renderSubject(refetchInterval)

		expect(requestedOptions[0]?.()).toEqual({ refetchInterval: expected })
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('model metadata unavailable')

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/model metadata unavailable/iu)).toBeInTheDocument()
	})
})
