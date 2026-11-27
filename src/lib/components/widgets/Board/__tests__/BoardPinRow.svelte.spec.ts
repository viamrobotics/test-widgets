import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { flushSync } from 'svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../BoardPinRow.svelte'
import SetGpio from '../SetGpioWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

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
		send: Mock<(method: string, args: unknown[]) => Promise<unknown>>
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
		(_client: unknown, method: string, args: unknown, options: PollOptions) => {
			const query = mocks.makeQuery(method)
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
		mutateAsync: (args: unknown[]) => {
			mocks.calls.push(method)
			return mocks.send(method, args)
		},
		isPending: false,
		error: null,
	})),
}))

const INITIAL_DATA: Record<string, unknown> = {
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

const queryFor = (method: string, pin = '11') => {
	const query = mocks.queries.get(`${method}:${pin}`)
	if (!query) throw new Error(`No ${method} query for pin ${pin} was created.`)
	return query
}

const pollIntervalFor = (method: string, pin = '11') =>
	mocks.pollOptions.get(`${method}:${pin}`)?.().refetchInterval

const STORAGE_KEY = 'board-controls/test-part/test-board/pins'

const renderEmpty = () => render(PaneSubject, { props: { widget: Subject } })

const addPin = async (pin: string) => {
	const field = screen.getByRole('textbox', { name: 'Pin' })
	await userEvent.clear(field)
	if (pin !== '') await userEvent.type(field, pin)
	await userEvent.click(screen.getByRole('button', { name: 'Add pin' }))
}

const renderSubject = async () => {
	const result = renderEmpty()
	await addPin('11')
	return result
}

const rowHeadings = () =>
	screen.queryAllByRole('heading', { level: 4 }).map((heading) => heading.textContent?.trim())

const lastStatus = () => screen.getByTestId('status-line').textContent?.trim()

describe('Board Pin', () => {
	beforeEach(() => {
		localStorage.clear()
		mocks.queries.clear()
		mocks.pollOptions.clear()
		mocks.calls.length = 0
		mocks.send = vi.fn(() => Promise.resolve())
	})

	it('reads the polled duty cycle and frequency, and shows no level until one is known', async () => {
		await renderSubject()

		expect(screen.getByRole('heading', { name: '11' })).toBeInTheDocument()
		expect(screen.getByRole('status')).toHaveTextContent('-')
		expect(screen.getByRole('slider', { name: 'Duty cycle' })).toHaveValue('50')
		expect(screen.getByRole('spinbutton', { name: 'Frequency' })).toHaveValue(1000)
		expect(pollIntervalFor('getPWM')).toBe(5000)
		expect(pollIntervalFor('getPWMFrequency')).toBe(5000)
		expect(lastStatus()).toBe('')
	})

	it('creates no polled GetGPIO read, since a read turns the pin into an input', async () => {
		await renderSubject()

		expect(mocks.queries.has('getGPIO:11'), 'a polled getGPIO query exists').toBe(false)
		expect(mocks.calls).toEqual([])
	})

	it('sends one SetGPIO for a press of High, shows High, and reads nothing back', async () => {
		await renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'High' }))

		await waitFor(() => {
			expect(screen.getByRole('status')).toHaveTextContent('High')
		})
		expect(mocks.calls).toEqual(['setGPIO'])
		expect(mocks.send).toHaveBeenCalledWith('setGPIO', ['11', true])
	})

	it('shows Low after a press of Low', async () => {
		await renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Low' }))

		await waitFor(() => {
			expect(screen.getByRole('status')).toHaveTextContent('Low')
		})
	})

	it('sends one GetGPIO for a press of Read and shows the level it returns', async () => {
		mocks.send = vi.fn(() => Promise.resolve(true))
		await renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Read level of pin 11' }))

		await waitFor(() => {
			expect(screen.getByRole('status')).toHaveTextContent('High')
		})
		expect(mocks.send).toHaveBeenCalledWith('getGPIO', ['11'])
		expect(mocks.calls).toEqual(['getGPIO'])
	})

	it('shows no level after a write fails', async () => {
		await renderSubject()
		await userEvent.click(screen.getByRole('button', { name: 'High' }))
		await waitFor(() => {
			expect(screen.getByRole('status')).toHaveTextContent('High')
		})
		mocks.send = vi.fn(() => Promise.reject(new Error('pin refused')))

		await userEvent.click(screen.getByRole('button', { name: 'Low' }))

		await waitFor(() => {
			expect(screen.getByRole('status')).toHaveTextContent('-')
		})
	})

	it('holds Read back while a write on the pin is in flight, and says why', async () => {
		const call = deferred()
		mocks.send = vi.fn(() => call.promise)
		await renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'High' }))
		const read = screen.getByRole('button', { name: 'Read level of pin 11' })
		await waitFor(() => {
			expect(read).toHaveAttribute('aria-disabled', 'true')
		})
		await userEvent.click(read)

		expect(read).toHaveAccessibleDescription('Wait for the call in flight on this pin to finish.')
		expect(mocks.calls).toEqual(['setGPIO'])
		call.resolve()
	})

	it('sends nothing during a drag, then one SetPWM with the value over 100 on release', async () => {
		await renderSubject()
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
		await renderSubject()
		const field = screen.getByRole('spinbutton', { name: 'Frequency' })

		await userEvent.clear(field)
		await userEvent.type(field, '250')
		await userEvent.click(screen.getByRole('button', { name: 'Set frequency of pin 11' }))

		await waitFor(() => {
			expect(mocks.calls).toEqual(['setPWMFrequency', 'getPWMFrequency'])
		})
		expect(mocks.send).toHaveBeenCalledWith('setPWMFrequency', ['11', 250])
	})

	it('holds Set back for a frequency that is not whole hertz', async () => {
		await renderSubject()
		const field = screen.getByRole('spinbutton', { name: 'Frequency' })

		await userEvent.clear(field)
		await userEvent.type(field, '1.5')

		expect(screen.getByRole('button', { name: 'Set frequency of pin 11' })).toBeDisabled()
	})

	it('drops a second press while a write is in flight, and reads Sending until it settles', async () => {
		const call = deferred()
		mocks.send = vi.fn(() => call.promise)
		await renderSubject()

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
		await renderSubject()
		const duty = queryFor('getPWM')

		duty.isError = true
		duty.isSuccess = false
		duty.error = new Error('no pin named 11')
		flushSync()

		expect(pollIntervalFor('getPWM')).toBe(false)
		expect(pollIntervalFor('getPWMFrequency')).toBe(5000)
		expect(screen.queryByRole('slider', { name: 'Duty cycle' })).not.toBeInTheDocument()
		expect(screen.queryByText('no pin named 11')).not.toBeInTheDocument()
		expect(lastStatus()).toBe('11 is not polling')

		duty.refetch = vi.fn(() => {
			duty.isError = false
			duty.isSuccess = true
			duty.error = null
			return Promise.resolve({ isSuccess: true })
		})
		await userEvent.click(screen.getByRole('button', { name: 'Retry duty cycle of pin 11' }))

		expect(duty.refetch).toHaveBeenCalledTimes(1)
		await waitFor(() => {
			expect(pollIntervalFor('getPWM')).toBe(5000)
		})
		expect(screen.getByRole('slider', { name: 'Duty cycle' })).toBeInTheDocument()
		expect(lastStatus()).toBe('')
	})

	it('moves focus to the duty cycle slider when a focused Retry succeeds', async () => {
		await renderSubject()
		const duty = queryFor('getPWM')
		duty.isError = true
		duty.isSuccess = false
		flushSync()
		duty.refetch = vi.fn(() => {
			duty.isError = false
			duty.isSuccess = true
			return Promise.resolve({ isSuccess: true })
		})

		await userEvent.click(screen.getByRole('button', { name: 'Retry duty cycle of pin 11' }))

		await waitFor(() => {
			expect(screen.getByRole('slider', { name: 'Duty cycle' })).toHaveFocus()
		})
	})

	it("holds SetGpio for the same pin while its write is in flight, and leaves another pin's live", async () => {
		const call = deferred()
		mocks.send = vi.fn(() => call.promise)
		render(InWidgetsProvider, {
			props: {
				component: [Subject, SetGpio],
				props: { partID: 'test-part', resourceName: 'test-board' },
			},
		})
		const [pinControlField, setGpioField] = screen.getAllByRole('textbox', { name: 'Pin' })
		if (!pinControlField || !setGpioField) throw new Error('Both Pin fields should render')
		await userEvent.type(pinControlField, '11')
		await userEvent.click(screen.getByRole('button', { name: 'Add pin' }))
		await userEvent.type(setGpioField, '11')

		await userEvent.click(screen.getByRole('button', { name: 'High' }))

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
		})
		await userEvent.clear(setGpioField)
		await userEvent.type(setGpioField, '12')
		expect(screen.getByRole('button', { name: /execute/iu })).toBeEnabled()
		call.resolve()
	})

	it('polls nothing and shows only the Pin field until a name is added', () => {
		renderEmpty()

		expect(screen.getByRole('textbox', { name: 'Pin' })).toBeInTheDocument()
		expect(rowHeadings()).toEqual([])
		expect(mocks.queries.size).toBe(0)
	})

	it('adds a typed name once and rejects blank and duplicate names', async () => {
		renderEmpty()

		await addPin('   ')
		expect(rowHeadings()).toEqual([])

		await addPin('11')
		await addPin('11')
		expect(rowHeadings()).toEqual(['11'])
		expect(screen.getByRole('textbox', { name: 'Pin' })).toHaveValue('11')

		await addPin('12')
		expect(rowHeadings()).toEqual(['11', '12'])
		expect(screen.getByRole('textbox', { name: 'Pin' })).toHaveValue('')
	})

	it("a write in flight on one pin leaves another pin's controls enabled", async () => {
		const call = deferred()
		mocks.send = vi.fn(() => call.promise)
		renderEmpty()
		await addPin('11')
		await addPin('12')

		const pinTwo = within(screen.getByRole('group', { name: '12' }))
		await userEvent.click(
			within(screen.getByRole('group', { name: '11' })).getByRole('button', { name: 'High' })
		)

		await waitFor(() => {
			expect(mocks.send).toHaveBeenCalledWith('setGPIO', ['11', true])
		})
		expect(pinTwo.getByRole('button', { name: 'High' })).toBeEnabled()
		expect(pinTwo.getByRole('slider', { name: 'Duty cycle' })).toBeEnabled()
		expect(pinTwo.getByRole('button', { name: 'Set frequency of pin 12' })).toBeEnabled()

		call.resolve()
	})

	it('keeps the added names for this board after a reload', async () => {
		const { unmount } = renderEmpty()
		await addPin('11')
		await addPin('12')
		unmount()

		renderEmpty()

		expect(rowHeadings()).toEqual(['11', '12'])
		expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual(['11', '12'])
	})

	it('loads the names saved for this board', () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(['7', '8']))

		renderEmpty()

		expect(rowHeadings()).toEqual(['7', '8'])
	})

	it('removes a row for Remove, keeps the Pin field, sends nothing, and saves the list', async () => {
		renderEmpty()
		await addPin('11')
		await addPin('12')

		await userEvent.click(screen.getByRole('button', { name: 'Remove pin 11' }))

		expect(screen.getByRole('textbox', { name: 'Pin' })).toBeInTheDocument()
		expect(rowHeadings()).toEqual(['12'])
		expect(mocks.send).not.toHaveBeenCalled()
		expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual(['12'])
	})
})
