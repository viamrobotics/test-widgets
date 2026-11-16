import { act, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../vision-service.svelte'

const state = vi.hoisted((): { errors: Record<string, Error | null>; fetching: boolean } => ({
	errors: {},
	fetching: false,
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			data: undefined,
			isLoading: false,
			isSuccess: true,
			isError: false,
			fetchStatus: 'idle',
			get isFetching() {
				return state.fetching
			},
			get error() {
				return state.errors[method] ?? null
			},
			refetch: vi.fn(),
		})),
		useResourceStatuses: vi.fn(() => ({ current: [] })),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-vision' },
	})

const SLOW_MESSAGE = 'This request is taking a long time to complete.'
const SLOW_REQUEST_THRESHOLD_MS = 5000

describe('Vision service widget', () => {
	beforeEach(() => {
		state.errors = {}
		state.fetching = false
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('renders the CaptureAllFromCamera section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'CaptureAllFromCamera' })).toBeInTheDocument()
	})

	it('adds the GetObjectPointClouds section only once point clouds are shown', async () => {
		renderSubject()
		expect(screen.queryByRole('heading', { name: 'GetObjectPointClouds' })).not.toBeInTheDocument()

		await userEvent.click(screen.getByRole('switch', { name: /show object point clouds/iu }))

		expect(screen.getByRole('heading', { name: 'GetObjectPointClouds' })).toBeInTheDocument()
	})

	it("shows a failing capture query in the section's error indicator", () => {
		state.errors.captureAllFromCamera = new Error('capture failed')

		renderSubject()

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})

	it("shows a failing point cloud query in its section's error indicator", async () => {
		state.errors.getObjectPointClouds = new Error('point clouds failed')
		renderSubject()

		await userEvent.click(screen.getByRole('switch', { name: /show object point clouds/iu }))

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})

	it('shows the slow request message once a fetch passes the threshold', async () => {
		vi.useFakeTimers()
		state.fetching = true
		renderSubject()
		expect(screen.queryByText(SLOW_MESSAGE)).not.toBeInTheDocument()

		await act(() => vi.advanceTimersByTimeAsync(SLOW_REQUEST_THRESHOLD_MS))

		expect(screen.getAllByText(SLOW_MESSAGE).length).toBeGreaterThan(0)
	})
})
