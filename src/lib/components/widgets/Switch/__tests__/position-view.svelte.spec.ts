import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import Subject from '../position-view.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted(
	(): {
		mutateAsync: Mock
		refetch: Mock
		position: number
		positions: [number, string[]]
		mutationError: Error | null
		queryError: Error | null
	} => ({
		mutateAsync: vi.fn(),
		refetch: vi.fn(),
		position: 1,
		positions: [3, ['Off', 'On', 'Auto']],
		mutationError: null,
		queryError: null,
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
			get error() {
				return method === 'getPosition' ? state.queryError : null
			},
			refetch: state.refetch,
			queryKey: [],
		})),
		createResourceMutation: vi.fn(() => ({
			mutateAsync: (...args: unknown[]) => state.mutateAsync(...args),
			isPending: false,
			get error() {
				return state.mutationError
			},
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const deferred = () => {
	let resolve = () => {}
	let reject: (error: Error) => void = () => {}
	const promise = new Promise<void>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve, reject }
}

const statusText = () => screen.getByTestId('status-line').textContent.trim()

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

const renderSubject = () =>
	render(InWidgetsProvider, {
		props: { component: Subject, props: { partID: 'test-part', resourceName: 'test-switch' } },
	})

describe('Switch position widget', () => {
	beforeEach(() => {
		state.mutateAsync = vi.fn(() => Promise.resolve())
		state.refetch = vi.fn()
		state.position = 1
		state.positions = [3, ['Off', 'On', 'Auto']]
		state.mutationError = null
		state.queryError = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the SetPosition section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'SetPosition' })).toBeInTheDocument()
	})

	it('polls the position every 500 ms and reads the count once', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getPosition', {
			refetchInterval: 500,
		})
		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getNumberOfPositions')
	})

	it('sets the position and refetches it when a position is picked', async () => {
		renderSubject()

		await userEvent.click(await screen.findByRole('radio', { name: 'Auto' }))

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

		await userEvent.click(await screen.findByRole('radio', { name: 'Auto' }))

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

		await userEvent.click(await screen.findByRole('radio', { name: 'Auto' }))
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

	it("shows a failing query in the section's error indicator", () => {
		state.queryError = new Error('switch unreachable')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'SetPosition: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})

	it("shows the set position error in the section's error indicator", () => {
		state.mutationError = new Error('switch refused')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'SetPosition: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})

const PANE_WIDTH = '320px'

const renderInPane = () => {
	render(PaneSubject, { props: { widget: Subject } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

describe('Switch position widget in a 320 px pane', () => {
	beforeEach(() => {
		state.mutateAsync = vi.fn(() => Promise.resolve())
		state.position = 1
		state.positions = [3, ['Off', 'On', 'Auto']]
		state.mutationError = null
		state.queryError = null
	})

	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('draws 3 labeled positions as the toggle group', async () => {
		renderInPane()
		await settleLayout()

		expect(screen.getByRole('radiogroup', { name: 'Position' })).toBeInTheDocument()
		expect(screen.getAllByRole('radio')).toHaveLength(3)
		expect(screen.queryByRole('combobox', { name: 'Position' })).not.toBeInTheDocument()
	})

	it('draws 13 numbered positions as a Select', async () => {
		state.positions = [13, []]

		renderInPane()
		await settleLayout()

		expect(screen.getByRole('combobox', { name: 'Position' })).toBeInTheDocument()
		expect(screen.queryByRole('radio')).not.toBeInTheDocument()
	})

	it('does not scroll horizontally with 3 labeled positions', async () => {
		const { pane, root } = renderInPane()
		await settleLayout()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})

	it('does not scroll horizontally with 13 numbered positions', async () => {
		state.positions = [13, []]

		const { pane, root } = renderInPane()
		await settleLayout()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
