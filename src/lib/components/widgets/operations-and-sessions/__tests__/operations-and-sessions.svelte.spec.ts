import { render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../operations-and-sessions.svelte'

const state = vi.hoisted(
	(): {
		operationsError: Error | null
		sessionsError: Error | null
		cancelError: Error | null
	} => ({ operationsError: null, sessionsError: null, cancelError: null })
)

const createMockQuery = (getError: () => Error | null) => ({
	data: undefined,
	isLoading: false,
	isSuccess: false,
	isRefetching: false,
	fetchStatus: 'idle',
	get error() {
		return getError()
	},
})

vi.mock('@viamrobotics/svelte-sdk', () => ({
	useRobotClient: vi.fn(() => ({ current: undefined })),
	createRobotQuery: vi.fn((_client: unknown, method: string) =>
		createMockQuery(() =>
			method === 'getOperations' ? state.operationsError : state.sessionsError
		)
	),
	createRobotMutation: vi.fn(() => ({
		mutate: vi.fn(),
		get error() {
			return state.cancelError
		},
	})),
}))

describe('OperationsAndSessions', () => {
	beforeEach(() => {
		state.operationsError = null
		state.sessionsError = null
		state.cancelError = null
	})

	it('shows no errors when nothing failed', () => {
		render(Subject, { partID: 'part-id' })

		expect(screen.getByRole('button', { name: 'No errors' })).toBeInTheDocument()
	})

	it('reports a failed operations query in the heading indicator, even while collapsed', () => {
		state.operationsError = new Error('operations unavailable')

		render(Subject, { partID: 'part-id' })

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Copy error' })).not.toBeInTheDocument()
	})

	it('collects the query and cancel errors in one indicator', () => {
		state.operationsError = new Error('operations unavailable')
		state.sessionsError = new Error('sessions unavailable')
		state.cancelError = new Error('cancel refused')

		render(Subject, { partID: 'part-id' })

		expect(screen.getByRole('button', { name: '3 errors, copy to clipboard' })).toBeInTheDocument()
	})
})
