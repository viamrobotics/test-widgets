import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../Switch.svelte'

const state = vi.hoisted(
	(): {
		mutateAsync: Mock
		refetch: Mock
		mutationError: Error | null
		queryError: Error | null
	} => ({
		mutateAsync: vi.fn(),
		refetch: vi.fn(),
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
			data: method === 'getPosition' ? 1 : [3, ['Off', 'On', 'Auto']],
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
			mutateAsync: state.mutateAsync,
			isPending: false,
			get error() {
				return state.mutationError
			},
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-switch' },
	})

describe('Switch widget', () => {
	beforeEach(() => {
		state.mutateAsync = vi.fn()
		state.refetch = vi.fn()
		state.mutationError = null
		state.queryError = null
	})

	it('renders the SetPosition section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'SetPosition' })).toBeInTheDocument()
	})

	it('sets the position and refetches when a position is picked', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Auto' }))

		expect(state.mutateAsync).toHaveBeenCalledWith([2])
		expect(state.refetch).toHaveBeenCalledTimes(1)
	})

	it("shows a failing query in the section's error indicator", () => {
		state.queryError = new Error('switch unreachable')

		renderSubject()

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})

	it("shows the set position error in the section's error indicator", () => {
		state.mutationError = new Error('switch refused')

		renderSubject()

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})
})
