import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../switch-controls.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted(
	(): {
		mutateAsync: Mock
		refetch: Mock
		position: number
		positions: [number, string[]]
	} => ({
		mutateAsync: vi.fn(),
		refetch: vi.fn(),
		position: 1,
		positions: [3, ['Off', 'On', 'Auto']],
	})
)

vi.mock('@viamrobotics/sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/sdk')>()),
	SwitchClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			data: method === 'getPosition' ? state.position : state.positions,
			isLoading: false,
			isSuccess: true,
			isError: false,
			fetchStatus: 'idle',
			error: null,
			refetch: state.refetch,
			queryKey: [],
		})),
		createResourceMutation: vi.fn(() => ({
			mutate: vi.fn(),
			mutateAsync: (...args: unknown[]) => state.mutateAsync(...args),
			isPending: false,
			error: null,
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const nextFrame = () =>
	new Promise<void>((resolve) => {
		requestAnimationFrame(() => {
			resolve()
		})
	})

const settleLayout = async () => {
	await document.fonts.ready
	await nextFrame()
	await nextFrame()
}

const renderSubject = () => render(PaneSubject, { props: { widget: Subject } })

const statusText = () => screen.getByTestId('status-line').textContent.trim()

const deferred = () => {
	let resolve = () => {}
	let reject: (error: Error) => void = () => {}
	const promise = new Promise<void>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve, reject }
}

describe('Switch Controls', () => {
	beforeEach(() => {
		state.mutateAsync = vi.fn(() => Promise.resolve())
		state.refetch = vi.fn()
		state.position = 1
		state.positions = [3, ['Off', 'On', 'Auto']]
	})

	it('renders the Controls heading and the Position toggle', async () => {
		renderSubject()
		await settleLayout()

		expect(screen.getByRole('heading', { name: 'Controls' })).toBeInTheDocument()
		expect(screen.getAllByRole('radio')).toHaveLength(3)
		expect(screen.queryByRole('link')).not.toBeInTheDocument()
	})

	it('sends one SetPosition for a pick and refetches the position', async () => {
		renderSubject()
		await settleLayout()

		await userEvent.click(screen.getByRole('radio', { name: 'Auto' }))

		expect(state.mutateAsync).toHaveBeenCalledTimes(1)
		expect(state.mutateAsync).toHaveBeenCalledWith([2])
		await waitFor(() => {
			expect(state.refetch).toHaveBeenCalledTimes(1)
		})
	})

	it('reads Sending <label> while in flight, and nothing otherwise, and drops a second pick', async () => {
		const call = deferred()
		state.mutateAsync = vi.fn(() => call.promise)
		renderSubject()
		await settleLayout()
		expect(statusText()).toBe('')

		await userEvent.click(screen.getByRole('radio', { name: 'Auto' }))

		await waitFor(() => {
			expect(screen.getByTestId('status-line')).toHaveTextContent('Sending Auto.')
		})
		expect(screen.getByRole('radio', { name: 'Off' })).toBeDisabled()
		await userEvent.click(screen.getByRole('radio', { name: 'Off' }))
		expect(state.mutateAsync).toHaveBeenCalledTimes(1)

		call.resolve()
		await waitFor(() => {
			expect(statusText()).toBe('')
		})
		expect(state.mutateAsync).toHaveBeenCalledTimes(1)
		expect(screen.getByRole('radio', { name: 'Off' })).toBeEnabled()
	})

	it('frees the group when the call fails', async () => {
		const call = deferred()
		state.mutateAsync = vi.fn(() => call.promise)
		renderSubject()
		await settleLayout()

		await userEvent.click(screen.getByRole('radio', { name: 'Auto' }))
		await waitFor(() => {
			expect(screen.getByRole('radio', { name: 'Off' })).toBeDisabled()
		})
		call.reject(new Error('switch refused'))

		await waitFor(() => {
			expect(screen.getByRole('radio', { name: 'Off' })).toBeEnabled()
		})
		expect(statusText()).toBe('')
		state.mutateAsync = vi.fn(() => Promise.resolve())
		await userEvent.click(screen.getByRole('radio', { name: 'Off' }))
		expect(state.mutateAsync).toHaveBeenCalledWith([0])
	})

	it('draws more positions than one row holds as a Select', async () => {
		state.positions = [13, []]
		renderSubject()
		await settleLayout()

		expect(screen.getByRole('combobox', { name: 'Position' })).toBeInTheDocument()
		expect(screen.queryAllByRole('radio')).toHaveLength(0)
	})
})
