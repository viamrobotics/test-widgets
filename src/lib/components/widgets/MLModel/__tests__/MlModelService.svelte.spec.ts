import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { RefetchRates } from '#lib/components/refetch-interval-store.svelte.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../MlModelService.svelte'

interface PollingOptions {
	refetchInterval: number | false
}

const { requestedOptions, refetch } = vi.hoisted(() => {
	const options: (PollingOptions | (() => PollingOptions))[] = []
	return { requestedOptions: options, refetch: vi.fn() }
})

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn(
			(_client: unknown, _method: string, options: PollingOptions | (() => PollingOptions)) => {
				requestedOptions.push(options)
				return {
					data: undefined,
					isLoading: true,
					isSuccess: false,
					isError: false,
					error: null,
					refetch,
				}
			}
		),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const STORED_RATE_KEY = 'control-card-refresh/test-part/test-ml-model/ml-model-service'

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-ml-model' },
	})

const activePollingIntervals = () =>
	requestedOptions
		.map((options) => (typeof options === 'function' ? options() : options).refetchInterval)
		.filter((interval) => interval !== false)

const pickRate = async (user: ReturnType<typeof userEvent.setup>, rate: string) => {
	await user.click(screen.getByRole('combobox', { name: 'Updates' }))
	await user.click(await screen.findByRole('option', { name: rate }))
}

describe('ML model service widget', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
		requestedOptions.length = 0
		localStorage.removeItem(STORED_RATE_KEY)
	})

	it('renders the Metadata section', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Metadata' })).toBeInTheDocument()
	})

	it('polls Metadata only at the rate picked', async () => {
		renderSubject()

		await pickRate(user, RefetchRates.FIVE_SEC)

		expect(activePollingIntervals()).toEqual([5000])
	})

	it('refetches Metadata when manual refresh is pressed', async () => {
		renderSubject()
		await user.click(screen.getByRole('button', { name: 'Pause' }))

		await user.click(screen.getByRole('button', { name: 'Refresh' }))

		expect(refetch).toHaveBeenCalledTimes(1)
	})
})
