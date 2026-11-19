import type { Component, ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../operations-and-sessions.svelte'
import RttPill from '../rtt-pill.svelte'
import PaneFixture, { type InPaneProps } from './__fixtures__/in-pane.svelte'
import WithQueryClientFixture, {
	type WithQueryClientProps,
} from './__fixtures__/with-query-client.svelte'

const Pane: Component<InPaneProps<ComponentProps<typeof Subject>>> = PaneFixture
const WithQueryClient: Component<WithQueryClientProps<ComponentProps<typeof Subject>>> =
	WithQueryClientFixture

const NARROW_PX = 320

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
		render(WithQueryClient, { props: { widget: Subject, props: { partID: 'part-id' } } })

		expect(screen.getByRole('button', { name: 'No errors' })).toBeInTheDocument()
	})

	it('reports a failed operations query in the heading indicator', () => {
		state.operationsError = new Error('operations unavailable')

		render(WithQueryClient, { props: { widget: Subject, props: { partID: 'part-id' } } })

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Copy error' })).not.toBeInTheDocument()
	})

	it('fills its container with no fixed position and no collapse', () => {
		render(WithQueryClient, { props: { widget: Subject, props: { partID: 'part-id' } } })

		const region = screen.getByRole('region', { name: 'Operations and sessions' })
		expect(getComputedStyle(region).position).not.toBe('fixed')
		expect(screen.queryByRole('button', { name: /expand|collapse/iu })).not.toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Operations' })).toBeInTheDocument()
	})

	it('keeps the root and the pane within 320 px', () => {
		render(Pane, {
			props: { widget: Subject, width: NARROW_PX, props: { partID: 'part-id' } },
		})

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? pane
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})

	it('collects the query and cancel errors in one indicator', () => {
		state.operationsError = new Error('operations unavailable')
		state.sessionsError = new Error('sessions unavailable')
		state.cancelError = new Error('cancel refused')

		render(WithQueryClient, { props: { widget: Subject, props: { partID: 'part-id' } } })

		expect(screen.getByRole('button', { name: '3 errors, copy to clipboard' })).toBeInTheDocument()
	})
})

describe('RttPill', () => {
	it.each([
		[0, 'badge-success'],
		[49, 'badge-success'],
		[50, 'badge-warning'],
		[499, 'badge-warning'],
		[500, 'badge-danger'],
		[2000, 'badge-danger'],
	])('colors %i ms as %s', (rtt, variantClass) => {
		render(RttPill, { rtt })

		expect(screen.getByText(`RTT ${rtt} ms`)).toHaveClass('badge', variantClass)
	})
})
