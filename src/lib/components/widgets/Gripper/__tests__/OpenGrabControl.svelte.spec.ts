import type { Mock } from 'vitest'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../OpenGrabControl.svelte'

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

		await userEvent.click(screen.getByRole('button', { name: 'open' }))

		expect(mutations.open.mutate).toHaveBeenCalledWith([], {})
	})

	it('calls the grab mutation when Grab is clicked', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'grab' }))

		expect(mutations.grab.mutate).toHaveBeenCalledWith([], {})
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
