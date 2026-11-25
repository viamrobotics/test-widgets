import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { flushSync } from 'svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../board-digital-interrupt-row.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

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

type PollOptions = () => { enabled?: boolean; refetchInterval?: number | false }

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
		(_client: unknown, method: string, args: unknown, options: PollOptions) => {
			const query = mocks.makeQuery()
			const resolved: unknown = typeof args === 'function' ? args() : args
			const [name]: unknown[] = Array.isArray(resolved) ? resolved : []
			const key = `${method}:${String(name)}`
			mocks.queries.set(key, query)
			mocks.pollOptions.set(key, options)
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

const INITIAL_DATA: unknown = 1204

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

const METHOD = 'getDigitalInterruptValue'

const queryFor = (name = 'd1') => {
	const query = mocks.queries.get(`${METHOD}:${name}`)
	if (!query) throw new Error(`No ${METHOD} query for ${name} was created.`)
	return query
}

const pollInterval = (name = 'd1') => mocks.pollOptions.get(`${METHOD}:${name}`)?.().refetchInterval

const STORAGE_KEY = 'board-controls/test-part/test-board/digital-interrupts'

const renderEmpty = () => render(PaneSubject, { props: { widget: Subject } })

const renderSeeded = (digitalInterrupts: string[]) =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-board', digitalInterrupts } })

const addName = async (name: string) => {
	const field = screen.getByRole('textbox', { name: 'Interrupt' })
	await userEvent.clear(field)
	if (name !== '') await userEvent.type(field, name)
	await userEvent.click(screen.getByRole('button', { name: 'Add interrupt' }))
}

const renderSubject = async () => {
	const result = renderEmpty()
	await addName('d1')
	return result
}

const rowHeadings = () =>
	screen.queryAllByRole('heading', { level: 4 }).map((heading) => heading.textContent?.trim())

const lastStatus = () => screen.getByTestId('status-line').textContent?.trim()

describe('Board DigitalInterrupt', () => {
	beforeEach(() => {
		localStorage.clear()
		mocks.queries.clear()
		mocks.pollOptions.clear()
		mocks.mutations.length = 0
	})

	it('reads the count from the response and polls every 1000 ms', async () => {
		await renderSubject()
		expect(screen.getByRole('heading', { name: 'd1' })).toBeInTheDocument()
		expect(screen.getByRole('status')).toHaveTextContent('1204')
		expect(pollInterval()).toBe(1000)
		expect(lastStatus()).toBe('')
	})

	it('stops polling a failed read, shows -, and resumes when Retry succeeds', async () => {
		await renderSubject()
		const query = queryFor()

		query.isError = true
		query.isSuccess = false
		query.error = new Error('no such name')
		flushSync()

		expect(pollInterval()).toBe(false)
		expect(screen.getByRole('status')).toHaveTextContent('-')
		expect(screen.queryByText('no such name')).not.toBeInTheDocument()
		expect(lastStatus()).toBe('d1 is not polling')

		query.refetch = vi.fn(() => {
			query.isError = false
			query.isSuccess = true
			query.error = null
			return Promise.resolve({ isSuccess: true })
		})
		await userEvent.click(
			screen.getByRole('button', { name: 'Retry value of digital interrupt d1' })
		)

		expect(query.refetch).toHaveBeenCalledTimes(1)
		await waitFor(() => {
			expect(pollInterval()).toBe(1000)
		})
		expect(screen.getByRole('status')).toHaveTextContent('1204')
		expect(lastStatus()).toBe('')
	})

	it('polls nothing and shows only the Interrupt field until a name is added', () => {
		renderEmpty()

		expect(screen.getByRole('textbox', { name: 'Interrupt' })).toBeInTheDocument()
		expect(rowHeadings()).toEqual([])
		expect(mocks.queries.size).toBe(0)
	})

	it('adds a typed name once and rejects blank and duplicate names', async () => {
		renderEmpty()

		await addName('   ')
		expect(rowHeadings()).toEqual([])

		await addName('d1')
		await addName('d1')
		expect(rowHeadings()).toEqual(['d1'])
		expect(screen.getByRole('textbox', { name: 'Interrupt' })).toHaveValue('d1')

		await addName('d2')
		expect(rowHeadings()).toEqual(['d1', 'd2'])
		expect(screen.getByRole('textbox', { name: 'Interrupt' })).toHaveValue('')
	})

	it('keeps the added names for this board after a reload', async () => {
		const { unmount } = renderEmpty()
		await addName('d1')
		await addName('d2')
		unmount()

		renderEmpty()

		expect(rowHeadings()).toEqual(['d1', 'd2'])
		expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual(['d1', 'd2'])
	})

	it('seeds the list from digitalInterrupts when nothing is stored', () => {
		renderSeeded(['d1', 'd2'])

		expect(rowHeadings()).toEqual(['d1', 'd2'])
		expect(screen.getByRole('textbox', { name: 'Interrupt' })).toBeInTheDocument()
	})

	it('lets the stored names win over digitalInterrupts', () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(['stored']))

		renderSeeded(['d1'])

		expect(rowHeadings()).toEqual(['stored'])
	})

	it('removes a row for Remove, keeps the Interrupt field, sends nothing, and saves the list', async () => {
		renderSeeded(['d1', 'd2'])

		await userEvent.click(screen.getByRole('button', { name: 'Remove digital interrupt d1' }))

		expect(screen.getByRole('textbox', { name: 'Interrupt' })).toBeInTheDocument()
		expect(rowHeadings()).toEqual(['d2'])
		expect(mocks.mutations).toEqual([])
		expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual(['d2'])
	})
})
