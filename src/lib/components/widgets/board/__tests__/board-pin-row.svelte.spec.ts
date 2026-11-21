import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { flushSync } from 'svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from './__fixtures__/board-pin-row-in-320-pane.svelte'

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
		send: Mock<(method: string, args: unknown[]) => Promise<void>>
		calls: string[]
		makeQuery: (method: string) => MockQuery
	} => ({
		queries: new Map(),
		pollOptions: new Map(),
		send: vi.fn(),
		calls: [],
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
			const query = mocks.makeQuery(method)
			mocks.queries.set(method, query)
			mocks.pollOptions.set(method, options)
			return query
		}
	),
	createResourceMutation: vi.fn((_client: unknown, method: string) => ({
		mutate: vi.fn(),
		mutateAsync: (args: unknown[]) => {
			mocks.calls.push(method)
			return mocks.send(method, args)
		},
		isPending: false,
		error: null,
	})),
}))

const INITIAL_DATA: Record<string, unknown> = {
	getGPIO: true,
	getPWM: 0.5,
	getPWMFrequency: 1000,
}

mocks.makeQuery = (method) => {
	const query = $state<MockQuery>({
		data: INITIAL_DATA[method],
		isError: false,
		isSuccess: true,
		isLoading: false,
		fetchStatus: 'idle',
		error: null,
		refetch: vi.fn(),
		queryKey: [],
	})
	query.refetch = vi.fn(() => {
		mocks.calls.push(method)
		return Promise.resolve({ isSuccess: !query.isError })
	})
	return query
}

const deferred = () => {
	let resolve = () => {}
	const promise = new Promise<void>((res) => {
		resolve = res
	})
	return { promise, resolve }
}

const queryFor = (method: string) => {
	const query = mocks.queries.get(method)
	if (!query) throw new Error(`No ${method} query was created.`)
	return query
}

const pollIntervalFor = (method: string) => mocks.pollOptions.get(method)?.().refetchInterval

let onRemove: Mock<() => void>
let onStatusChange: Mock<(text: string) => void>

const renderSubject = () =>
	render(Subject, {
		props: {
			partID: 'test-part',
			resourceName: 'test-board',
			name: '11',
			onRemove,
			onStatusChange,
		},
	})

const lastStatus = () => onStatusChange.mock.lastCall?.[0]

describe('BoardPinRow', () => {
	beforeEach(() => {
		mocks.queries.clear()
		mocks.pollOptions.clear()
		mocks.calls.length = 0
		mocks.send = vi.fn(() => Promise.resolve())
		onRemove = vi.fn()
		onStatusChange = vi.fn()
	})

	it('reads the polled level, duty cycle, and frequency', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: '11' })).toBeInTheDocument()
		expect(screen.getByRole('status')).toHaveTextContent('High')
		expect(screen.getByRole('slider', { name: 'Duty cycle' })).toHaveValue('50')
		expect(screen.getByRole('spinbutton', { name: 'Frequency' })).toHaveValue(1000)
		expect(pollIntervalFor('getGPIO')).toBe(1000)
		expect(pollIntervalFor('getPWM')).toBe(5000)
		expect(pollIntervalFor('getPWMFrequency')).toBe(5000)
		expect(lastStatus()).toBe('')
	})

	it('sends one SetGPIO for a press of High, then one GetGPIO', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'High' }))

		await waitFor(() => {
			expect(mocks.calls).toEqual(['setGPIO', 'getGPIO'])
		})
		expect(mocks.send).toHaveBeenCalledTimes(1)
		expect(mocks.send).toHaveBeenCalledWith('setGPIO', ['11', true])
	})

	it('sends nothing during a drag, then one SetPWM with the value over 100 on release', async () => {
		renderSubject()
		const range = screen.getByRole('slider', { name: 'Duty cycle' })

		await fireEvent.pointerDown(range)
		await fireEvent.input(range, { target: { value: '70' } })
		queryFor('getPWM').data = 0.2
		flushSync()

		expect(mocks.send).not.toHaveBeenCalled()
		expect(range).toHaveValue('70')
		expect(lastStatus()).toBe('Release to send 11 duty cycle 70%')

		await fireEvent.change(range)
		await fireEvent.pointerUp(range)

		await waitFor(() => {
			expect(mocks.calls).toEqual(['setPWM', 'getPWM'])
		})
		expect(mocks.send).toHaveBeenCalledTimes(1)
		expect(mocks.send).toHaveBeenCalledWith('setPWM', ['11', 0.7])
	})

	it('sends one SetPWMFrequency for Set, then one PWMFrequency read', async () => {
		renderSubject()
		const field = screen.getByRole('spinbutton', { name: 'Frequency' })

		await userEvent.clear(field)
		await userEvent.type(field, '250')
		await userEvent.click(screen.getByRole('button', { name: 'Set frequency of pin 11' }))

		await waitFor(() => {
			expect(mocks.calls).toEqual(['setPWMFrequency', 'getPWMFrequency'])
		})
		expect(mocks.send).toHaveBeenCalledWith('setPWMFrequency', ['11', 250])
	})

	it('drops a second press while a write is in flight, and reads Sending until it settles', async () => {
		const call = deferred()
		mocks.send = vi.fn(() => call.promise)
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'High' }))

		await waitFor(() => {
			expect(lastStatus()).toBe('Sending 11 high.')
		})
		const low = screen.getByRole('button', { name: 'Low' })
		expect(low).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Set frequency of pin 11' })).toBeDisabled()
		await fireEvent.click(low)
		expect(mocks.send).toHaveBeenCalledTimes(1)

		call.resolve()
		await waitFor(() => {
			expect(lastStatus()).toBe('')
		})
		expect(low).toBeEnabled()
		expect(mocks.send).toHaveBeenCalledTimes(1)
	})

	it('stops polling a failed read, shows -, and resumes when Retry succeeds', async () => {
		renderSubject()
		const level = queryFor('getGPIO')

		level.isError = true
		level.isSuccess = false
		level.error = new Error('no pin named 11')
		flushSync()

		expect(pollIntervalFor('getGPIO')).toBe(false)
		expect(pollIntervalFor('getPWM')).toBe(5000)
		expect(screen.getByRole('status')).toHaveTextContent('-')
		expect(screen.queryByText('no pin named 11')).not.toBeInTheDocument()
		expect(lastStatus()).toBe('11 is not polling')

		level.refetch = vi.fn(() => {
			level.isError = false
			level.isSuccess = true
			level.error = null
			return Promise.resolve({ isSuccess: true })
		})
		await userEvent.click(screen.getByRole('button', { name: 'Retry level of pin 11' }))

		expect(level.refetch).toHaveBeenCalledTimes(1)
		await waitFor(() => {
			expect(pollIntervalFor('getGPIO')).toBe(1000)
		})
		expect(screen.getByRole('status')).toHaveTextContent('High')
		expect(lastStatus()).toBe('')
	})

	it('calls onRemove for Remove and sends nothing', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Remove pin 11' }))

		expect(onRemove).toHaveBeenCalledTimes(1)
		expect(mocks.send).not.toHaveBeenCalled()
	})
})
