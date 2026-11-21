import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { flushSync } from 'svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from './__fixtures__/board-analog-reader-row-in-320-pane.svelte'

interface MockQuery {
	data: unknown
	isError: boolean
	isSuccess: boolean
	isLoading: boolean
	fetchStatus: string
	error: Error | null
	refetch: Mock<() => Promise<{ isSuccess: boolean }>>
	queryKey: unknown[]
}

type PollOptions = () => { refetchInterval?: number | false }

const mocks = vi.hoisted(
	(): {
		queries: Map<string, MockQuery>
		pollOptions: Map<string, PollOptions>
		mutations: string[]
		makeQuery: () => MockQuery
	} => ({
		queries: new Map(),
		pollOptions: new Map(),
		mutations: [],
		makeQuery: () => {
			throw new Error('makeQuery is assigned once the spec module loads.')
		},
	})
)

vi.mock('@viamrobotics/sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/sdk')>()),
	BoardClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(
		(_client: unknown, method: string, _args: unknown, options: PollOptions) => {
			const query = mocks.makeQuery()
			mocks.queries.set(method, query)
			mocks.pollOptions.set(method, options)
			return query
		}
	),
	createResourceMutation: vi.fn((_client: unknown, method: string) => ({
		mutate: vi.fn(),
		mutateAsync: () => {
			mocks.mutations.push(method)
			return Promise.resolve()
		},
		isPending: false,
		error: null,
	})),
}))

const INITIAL_DATA: unknown = { value: 512, minRange: 0, maxRange: 1023, stepSize: 1 }

mocks.makeQuery = () => {
	const query = $state<MockQuery>({
		data: INITIAL_DATA,
		isError: false,
		isSuccess: true,
		isLoading: false,
		fetchStatus: 'idle',
		error: null,
		refetch: vi.fn(),
		queryKey: [],
	})
	query.refetch = vi.fn(() => Promise.resolve({ isSuccess: !query.isError }))
	return query
}

const METHOD = 'readAnalogReader'

const queryFor = () => {
	const query = mocks.queries.get(METHOD)
	if (!query) throw new Error(`No ${METHOD} query was created.`)
	return query
}

const pollInterval = () => mocks.pollOptions.get(METHOD)?.().refetchInterval

let onRemove: Mock<() => void>
let onStatusChange: Mock<(text: string) => void>

const renderSubject = () =>
	render(Subject, {
		props: {
			partID: 'test-part',
			resourceName: 'test-board',
			name: 'a1',
			onRemove,
			onStatusChange,
		},
	})

const lastStatus = () => onStatusChange.mock.lastCall?.[0]

describe('BoardAnalogReaderRow', () => {
	beforeEach(() => {
		mocks.queries.clear()
		mocks.pollOptions.clear()
		mocks.mutations.length = 0
		onRemove = vi.fn()
		onStatusChange = vi.fn()
	})

	it('reads the value from the response and polls every 1000 ms', () => {
		renderSubject()
		expect(screen.getByRole('heading', { name: 'a1' })).toBeInTheDocument()
		expect(screen.getByRole('status')).toHaveTextContent('512')
		expect(screen.getByText('0')).toBeInTheDocument()
		expect(screen.getByText('1023')).toBeInTheDocument()
		expect(pollInterval()).toBe(1000)
		expect(lastStatus()).toBe('')
	})

	it('stops polling a failed read, shows -, and resumes when Retry succeeds', async () => {
		renderSubject()
		const query = queryFor()

		query.isError = true
		query.isSuccess = false
		query.error = new Error('no such name')
		flushSync()

		expect(pollInterval()).toBe(false)
		expect(screen.getByRole('status')).toHaveTextContent('-')
		expect(screen.queryByText('no such name')).not.toBeInTheDocument()
		expect(lastStatus()).toBe('a1 is not polling')

		query.refetch = vi.fn(() => {
			query.isError = false
			query.isSuccess = true
			query.error = null
			return Promise.resolve({ isSuccess: true })
		})
		await userEvent.click(screen.getByRole('button', { name: 'Retry value of analog reader a1' }))

		expect(query.refetch).toHaveBeenCalledTimes(1)
		await waitFor(() => {
			expect(pollInterval()).toBe(1000)
		})
		expect(screen.getByRole('status')).toHaveTextContent('512')
		expect(lastStatus()).toBe('')
	})

	it('calls onRemove for Remove and sends nothing', async () => {
		renderSubject()
		await userEvent.click(screen.getByRole('button', { name: 'Remove analog reader a1' }))

		expect(onRemove).toHaveBeenCalledTimes(1)
		expect(mocks.mutations).toEqual([])
	})
})
