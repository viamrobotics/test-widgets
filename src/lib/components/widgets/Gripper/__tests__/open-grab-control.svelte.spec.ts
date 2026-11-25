import type { Mock } from 'vitest'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import Subject from '../open-grab-control.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

interface MutationState {
	mutateAsync: Mock
	isPending: boolean
	error: Error | null
}

const makeMutation = (): MutationState => ({
	mutateAsync: vi.fn(() => Promise.resolve()),
	isPending: false,
	error: null,
})

const mutations = vi.hoisted(() => {
	const state: Record<'open' | 'grab', MutationState> = {
		open: { mutateAsync: vi.fn(), isPending: false, error: null },
		grab: { mutateAsync: vi.fn(), isPending: false, error: null },
	}
	return state
})

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn((_client: unknown, method: string) =>
		method === 'open' ? mutations.open : mutations.grab
	),
}))

const deferred = () => {
	let resolve: (value: unknown) => void = () => {}
	let reject: (reason: Error) => void = () => {}
	const promise = new Promise<unknown>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve, reject }
}

const renderSubject = () =>
	render(InWidgetsProvider, {
		props: { component: Subject, props: { partID: 'test-part', resourceName: 'test-gripper' } },
	})

describe('Gripper Open / Grab control', () => {
	beforeEach(() => {
		mutations.open = makeMutation()
		mutations.grab = makeMutation()
	})

	it('renders one heading naming both methods', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Open / Grab' })).toBeInTheDocument()
	})

	it('calls the open mutation when Open is clicked', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Open' }))

		expect(mutations.open.mutateAsync).toHaveBeenCalledWith([])
	})

	it('calls the grab mutation when Grab is clicked', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Grab' }))

		expect(mutations.grab.mutateAsync).toHaveBeenCalledWith([])
	})

	it('draws Open and Grab as extra-small buttons', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'Open' })).toHaveClass('button-xs')
		expect(screen.getByRole('button', { name: 'Grab' })).toHaveClass('button-xs')
	})

	it('shows the open call in flight as busy and disables Grab', async () => {
		const call = deferred()
		mutations.open.mutateAsync = vi.fn(() => call.promise)
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Open' }))

		expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute('aria-busy', 'true')
		expect(screen.getByRole('button', { name: 'Grab' })).toBeDisabled()
		expect(screen.getByTestId('status-line')).toHaveTextContent('Opening')
		call.resolve(undefined)
		await expect.element(screen.getByTestId('status-line')).toHaveTextContent('Opened')
	})

	it('sends nothing for a Grab press while Open is in flight, then or after', async () => {
		const call = deferred()
		mutations.open.mutateAsync = vi.fn(() => call.promise)
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Open' }))
		await userEvent.click(screen.getByRole('button', { name: 'Grab' }))
		call.resolve(undefined)
		await vi.waitFor(() => {
			expect(screen.getByRole('button', { name: 'Grab' })).toBeEnabled()
		})

		expect(mutations.grab.mutateAsync).not.toHaveBeenCalled()
		expect(mutations.open.mutateAsync).toHaveBeenCalledTimes(1)
	})

	it('sends nothing for an Open press while Grab is in flight', async () => {
		const call = deferred()
		mutations.grab.mutateAsync = vi.fn(() => call.promise)
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Grab' }))
		await userEvent.click(screen.getByRole('button', { name: 'Open' }))
		call.resolve(true)

		expect(mutations.open.mutateAsync).not.toHaveBeenCalled()
	})

	it('frees the group when a call fails', async () => {
		const call = deferred()
		mutations.open.mutateAsync = vi.fn(() => call.promise)
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Open' }))
		call.reject(new Error('open failed'))

		await vi.waitFor(() => {
			expect(screen.getByRole('button', { name: 'Grab' })).toBeEnabled()
		})
		await userEvent.click(screen.getByRole('button', { name: 'Grab' }))
		expect(mutations.grab.mutateAsync).toHaveBeenCalledTimes(1)
		expect(screen.getByTestId('status-line')).not.toHaveTextContent('Opened')
	})

	it('says Grab finished when Grab returns', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Grab' }))

		await vi.waitFor(() => {
			expect(screen.getByTestId('status-line')).toHaveTextContent('Grab finished')
		})
	})

	it('clears the result on the next press', async () => {
		const call = deferred()
		renderSubject()
		await userEvent.click(screen.getByRole('button', { name: 'Grab' }))
		await vi.waitFor(() => {
			expect(screen.getByTestId('status-line')).toHaveTextContent('Grab finished')
		})
		mutations.open.mutateAsync = vi.fn(() => call.promise)

		await userEvent.click(screen.getByRole('button', { name: 'Open' }))

		expect(screen.getByTestId('status-line')).toHaveTextContent('Opening')
		call.resolve(undefined)
	})

	it('shows an open error in the section indicator', () => {
		mutations.open.error = new Error('open failed')

		renderSubject()

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})

	it('shows a grab error in the section indicator', () => {
		mutations.grab.error = new Error('grab failed')

		renderSubject()

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})

	it('counts an open and a grab failure as two distinct errors', () => {
		mutations.open.error = new Error('open failed')
		mutations.grab.error = new Error('grab failed')

		renderSubject()

		expect(screen.getByRole('button', { name: '2 errors, copy to clipboard' })).toBeInTheDocument()
	})
})

const renderInPane = () => {
	render(PaneSubject, { props: { widget: Subject } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

describe('Gripper Open / Grab control in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		const { pane, root } = renderInPane()

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
