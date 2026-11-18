import type { Mock } from 'vitest'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../open-grab-control.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

interface MutationState {
	mutate: Mock
	isPending: boolean
	error: Error | null
}

const mutations = vi.hoisted(() => {
	const state: Record<'open' | 'grab', MutationState> = {
		open: { mutate: vi.fn(), isPending: false, error: null },
		grab: { mutate: vi.fn(), isPending: false, error: null },
	}
	return state
})

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn((_client: unknown, method: string) =>
		method === 'open' ? mutations.open : mutations.grab
	),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-gripper' },
	})

describe('Gripper Open / Grab control', () => {
	beforeEach(() => {
		mutations.open = { mutate: vi.fn(), isPending: false, error: null }
		mutations.grab = { mutate: vi.fn(), isPending: false, error: null }
	})

	it('renders one heading naming both methods', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Open / Grab' })).toBeInTheDocument()
	})

	it('calls the open mutation when Open is clicked', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Open' }))

		expect(mutations.open.mutate).toHaveBeenCalledWith([], {})
	})

	it('calls the grab mutation when Grab is clicked', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Grab' }))

		expect(mutations.grab.mutate).toHaveBeenCalledWith([], {})
	})

	it('draws Open and Grab as extra-small buttons', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'Open' })).toHaveClass('button-xs')
		expect(screen.getByRole('button', { name: 'Grab' })).toHaveClass('button-xs')
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
