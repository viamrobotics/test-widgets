import type { Component, ComponentProps } from 'svelte'

import { QueryClient } from '@tanstack/svelte-query'
import { render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../OperationsAndSessions.svelte'
import WithQueryClientFixture, {
	type WithQueryClientProps,
} from './__fixtures__/WithQueryClient.svelte'

const WithQueryClient: Component<WithQueryClientProps<ComponentProps<typeof Subject>>> =
	WithQueryClientFixture

const PART_ID = 'part-id'
const SLOW_MS = 600
const IDLE_MS = 600

const state = vi.hoisted(
	(): { operationsDelayMs: number; isConnected: boolean; operationsFail: boolean } => ({
		operationsDelayMs: 0,
		isConnected: true,
		operationsFail: false,
	})
)

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { createQuery } = await import('@tanstack/svelte-query')
	const respondAfter = async (delayMs: number) => {
		if (delayMs > 0) {
			await new Promise((resolve) => {
				setTimeout(resolve, delayMs)
			})
		}
		return []
	}
	const respondToOperations = async () => {
		await respondAfter(state.operationsDelayMs)
		if (state.operationsFail) {
			throw new Error('operations unavailable')
		}
		return []
	}
	return {
		useRobotClient: vi.fn((getPartID: () => string) => ({
			current: undefined,
			get partID() {
				return getPartID()
			},
		})),
		createRobotQuery: vi.fn((client: { partID: string }, method: string) =>
			createQuery(() => ({
				queryKey: ['viam-svelte-sdk', 'partID', client.partID, 'robotClient', method],
				queryFn: async () => (method === 'getOperations' ? respondToOperations() : respondAfter(0)),
				enabled: () => state.isConnected,
				retry: false,
			}))
		),
		createRobotMutation: vi.fn(() => ({ mutate: vi.fn(), error: null })),
	}
})

const operationsKey = ['viam-svelte-sdk', 'partID', PART_ID, 'robotClient', 'getOperations']

const wait = async (delayMs: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, delayMs)
	})

const mountWidget = (queryClient: QueryClient) => {
	render(WithQueryClient, {
		props: { widget: Subject, props: { partID: PART_ID }, client: queryClient },
	})
}

const fetchedOnce = async (queryClient: QueryClient) =>
	waitFor(() => {
		expect(queryClient.getQueryState(operationsKey)?.status).toBe('success')
	})

const unmeasuredPill = () => screen.getByText('RTT -')

const rttPill = () => screen.getByText(/^RTT \d+ ms, (?:healthy|slow|failing)$/u)

describe('OperationsAndSessions round trip time', () => {
	let queryClient: QueryClient

	beforeEach(() => {
		state.operationsDelayMs = 0
		state.isConnected = true
		state.operationsFail = false
		queryClient = new QueryClient()
	})

	it('reads RTT - before any round trip completes', () => {
		state.isConnected = false
		mountWidget(queryClient)

		expect(unmeasuredPill()).toHaveClass('badge', 'badge-neutral')
		expect(screen.queryByText(/healthy/u)).not.toBeInTheDocument()
	})

	it('reads RTT - while every poll fails', async () => {
		state.operationsFail = true
		mountWidget(queryClient)

		await waitFor(() => {
			expect(queryClient.getQueryState(operationsKey)?.status).toBe('error')
		})
		expect(unmeasuredPill()).toHaveClass('badge', 'badge-neutral')
		expect(screen.queryByText(/healthy/u)).not.toBeInTheDocument()
	})

	it('times a first fetch from its own start, not from mount', async () => {
		state.isConnected = false
		mountWidget(queryClient)
		await wait(IDLE_MS)
		state.isConnected = true

		await queryClient.refetchQueries({ queryKey: operationsKey })

		await waitFor(() => {
			expect(rttPill()).toHaveClass('badge', 'badge-success')
		})
	})

	it('reads a refetch that resolves at once as healthy after an idle stretch', async () => {
		mountWidget(queryClient)
		await fetchedOnce(queryClient)
		await wait(IDLE_MS)

		await queryClient.refetchQueries({ queryKey: operationsKey })

		await waitFor(() => {
			expect(rttPill()).toHaveClass('badge', 'badge-success')
		})
	})

	it('reads a refetch delayed past the warning threshold as failing', async () => {
		mountWidget(queryClient)
		await fetchedOnce(queryClient)
		state.operationsDelayMs = SLOW_MS

		await queryClient.refetchQueries({ queryKey: operationsKey })

		await waitFor(() => {
			expect(rttPill()).toHaveClass('badge', 'badge-danger')
		})
	})
})
