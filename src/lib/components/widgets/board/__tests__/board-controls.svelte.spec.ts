import { render, screen, waitFor, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from './__fixtures__/board-controls-in-320-pane.svelte'

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

const mocks = vi.hoisted(
	(): {
		queries: Map<string, MockQuery>
		send: Mock<(method: string, args: unknown[]) => Promise<void>>
		makeQuery: (method: string) => MockQuery
	} => ({
		queries: new Map(),
		send: vi.fn(),
		makeQuery: () => {
			throw new Error('makeQuery is assigned once the spec module loads.')
		},
	})
)

vi.mock('@viamrobotics/sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/sdk')>()),
	BoardClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string, args: unknown) => {
			const query = mocks.makeQuery(method)
			const resolved = typeof args === 'function' ? args() : args
			const [name] = Array.isArray(resolved) ? resolved : []
			mocks.queries.set(`${method}:${String(name)}`, query)
			return query
		}),
		createResourceMutation: vi.fn((_client: unknown, method: string) => ({
			mutate: vi.fn(),
			mutateAsync: (args: unknown[]) => mocks.send(method, args),
			isPending: false,
			error: null,
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const INITIAL_DATA: Record<string, unknown> = {
	getGPIO: true,
	getPWM: 0.5,
	getPWMFrequency: 1000,
	readAnalogReader: { value: 512, minRange: 0, maxRange: 1023, stepSize: 1 },
	getDigitalInterruptValue: 1204,
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
	query.refetch = vi.fn(() => Promise.resolve({ isSuccess: !query.isError }))
	return query
}

const deferred = () => {
	let resolve = () => {}
	const promise = new Promise<void>((resolvePromise) => {
		resolve = resolvePromise
	})
	return { promise, resolve }
}

const STORAGE_PREFIX = 'board-controls/test-part/test-board'

const addName = async (field: string, button: string, name: string) => {
	const input = screen.getByRole('textbox', { name: field })
	await userEvent.clear(input)
	if (name !== '') await userEvent.type(input, name)
	await userEvent.click(screen.getByRole('button', { name: button }))
}

const rowHeadings = () =>
	screen.queryAllByRole('heading', { level: 5 }).map((heading) => heading.textContent?.trim())

describe('BoardControls', () => {
	beforeEach(() => {
		localStorage.clear()
		mocks.queries.clear()
		mocks.send = vi.fn(() => Promise.resolve())
	})

	it('lays out Pins, Analog readers, Digital interrupts, and Power mode as h4 sections', () => {
		render(Subject)

		expect(
			screen.getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent?.trim())
		).toEqual(['Pins', 'Analog readers', 'Digital interrupts', 'Power mode'])
	})

	it('a write in flight on one pin leaves another pin controls enabled', async () => {
		const call = deferred()
		mocks.send = vi.fn(() => call.promise)
		render(Subject)
		await addName('Pin', 'Add pin', '11')
		await addName('Pin', 'Add pin', '12')

		const pinTwo = within(screen.getByRole('group', { name: '12' }))
		await userEvent.click(
			within(screen.getByRole('group', { name: '11' })).getByRole('button', { name: 'High' })
		)

		await waitFor(() => {
			expect(mocks.send).toHaveBeenCalledWith('setGPIO', ['11', true])
		})
		expect(pinTwo.getByRole('button', { name: 'High' })).toBeEnabled()
		expect(pinTwo.getByRole('button', { name: 'Low' })).toBeEnabled()
		expect(pinTwo.getByRole('slider', { name: 'Duty cycle' })).toBeEnabled()
		expect(pinTwo.getByRole('spinbutton', { name: 'Frequency' })).toBeEnabled()
		expect(pinTwo.getByRole('button', { name: 'Set frequency of pin 12' })).toBeEnabled()

		call.resolve()
	})

	it('seeds the analog and interrupt lists from props when nothing is stored', () => {
		render(Subject, { props: { analogReaders: ['a1'], digitalInterrupts: ['d1'] } })

		expect(rowHeadings()).toEqual(['a1', 'd1'])
	})

	it('lets stored names win over props', () => {
		localStorage.setItem(`${STORAGE_PREFIX}/analog-readers`, JSON.stringify(['stored']))
		render(Subject, { props: { analogReaders: ['a1'], digitalInterrupts: ['d1'] } })

		expect(rowHeadings()).toEqual(['stored', 'd1'])
	})

	it('adds a typed name once and rejects blank and duplicate names', async () => {
		render(Subject)

		await addName('Pin', 'Add pin', '   ')
		expect(rowHeadings()).toEqual([])

		await addName('Pin', 'Add pin', '11')
		await addName('Pin', 'Add pin', '11')
		expect(rowHeadings()).toEqual(['11'])
		expect(screen.getByRole('textbox', { name: 'Pin' })).toHaveValue('11')

		await addName('Reader', 'Add reader', 'a1')
		await addName('Interrupt', 'Add interrupt', 'd1')
		expect(rowHeadings()).toEqual(['11', 'a1', 'd1'])
	})

	it('removes a row without sending anything', async () => {
		render(Subject, { props: { analogReaders: ['a1'] } })
		await addName('Pin', 'Add pin', '11')

		await userEvent.click(screen.getByRole('button', { name: 'Remove pin 11' }))
		await userEvent.click(screen.getByRole('button', { name: 'Remove analog reader a1' }))

		expect(rowHeadings()).toEqual([])
		expect(mocks.send).not.toHaveBeenCalled()
	})

	it('shows the latest row text and clears it when that row reports an empty string', async () => {
		const call = deferred()
		mocks.send = vi.fn(() => call.promise)
		render(Subject, { props: { analogReaders: ['a9'] } })
		await addName('Pin', 'Add pin', '11')
		const line = screen.getByTestId('status-line')
		expect(line).toHaveTextContent('')

		const reader = mocks.queries.get('readAnalogReader:a9')
		if (!reader) throw new Error('No analog query was created.')
		reader.isError = true
		await waitFor(() => {
			expect(line).toHaveTextContent('a9 is not polling')
		})

		await userEvent.click(screen.getByRole('button', { name: 'High' }))
		await waitFor(() => {
			expect(line).toHaveTextContent('Sending 11 high.')
		})

		call.resolve()
		await waitFor(() => {
			expect(line).toHaveTextContent('a9 is not polling')
		})

		reader.isError = false
		await waitFor(() => {
			expect(line).toHaveTextContent('')
		})
		expect(line.textContent?.trim()).toBe('')
	})
})
