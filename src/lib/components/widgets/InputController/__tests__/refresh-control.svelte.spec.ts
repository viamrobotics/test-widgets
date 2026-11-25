import '../../../../../app.css'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'
import { RefetchIntervals, RefetchRates } from '$lib/components/refetch-interval-store.svelte'

import GetEvents from '../get-events-widget.svelte'
import Subject from '../refresh-control.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const POLL_INTERVAL_MS = 500
const PROPS = { partID: 'test-part', resourceName: 'test-input-controller' }

const state = vi.hoisted(
	(): {
		error: Error | null
		queries: { method: string; options: unknown }[]
		refetch: ReturnType<typeof vi.fn>
	} => ({ error: null, queries: [], refetch: vi.fn() })
)

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string, options: unknown) => {
			state.queries.push({ method, options })
			return {
				data: [{ control: 'ButtonSouth', event: 'ButtonPress', value: 1 }],
				isLoading: false,
				isSuccess: true,
				isError: false,
				get error() {
					return state.error
				},
				refetch: state.refetch,
			}
		}),
	}
})

const resolveOptions = (options: unknown) => (typeof options === 'function' ? options() : options)

const latestIntervalOf = (method: string) => {
	const query = state.queries.findLast((candidate) => candidate.method === method)
	return resolveOptions(query?.options)?.refetchInterval
}

const renderRefresh = () =>
	render(InWidgetsProvider, { props: { component: Subject, props: PROPS } })

describe('InputController Refresh widget', () => {
	beforeEach(() => {
		localStorage.clear()
		state.error = null
		state.queries = []
		state.refetch = vi.fn()
	})

	it('draws a Refresh heading and the refresh rate select', () => {
		renderRefresh()

		expect(screen.getByRole('heading', { name: 'Refresh' })).toBeInTheDocument()
		expect(screen.getByRole('combobox', { name: 'Refresh rate' })).toBeInTheDocument()
	})

	it('polls getEvents every second by default', () => {
		renderRefresh()

		expect(latestIntervalOf('getEvents')).toBe(RefetchIntervals.ONE_SEC)
	})

	it('shows the query error in the section error indicator', () => {
		state.error = new Error('events unavailable')

		renderRefresh()

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})

	it('hands its rate to GetEvents instead of the 500 ms default', () => {
		render(InWidgetsProvider, { props: { component: [Subject, GetEvents], props: PROPS } })

		expect(latestIntervalOf('getEvents')).toBe(RefetchIntervals.ONE_SEC)
		expect(latestIntervalOf('getEvents')).not.toBe(POLL_INTERVAL_MS)
		expect(screen.queryByText('Updates automatically')).not.toBeInTheDocument()
	})

	it('moves GetEvents to manual refresh when paused', async () => {
		const user = userEvent.setup()
		render(InWidgetsProvider, { props: { component: [Subject, GetEvents], props: PROPS } })

		await user.click(screen.getByRole('button', { name: 'Pause' }))

		expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
		expect(latestIntervalOf('getEvents'), 'goes red when GetEvents ignores the shared rate').toBe(
			RefetchIntervals.MANUAL
		)
		expect(RefetchRates.MANUAL).toBe('Manual refresh')
	})

	it('refetches the events when the manual refresh button is pressed', async () => {
		const user = userEvent.setup()
		renderRefresh()

		await user.click(screen.getByRole('button', { name: 'Pause' }))
		await user.click(screen.getByRole('button', { name: 'Refresh' }))

		expect(state.refetch).toHaveBeenCalledTimes(1)
	})

	it('leaves GetEvents at its own default without a Refresh widget', () => {
		render(InWidgetsProvider, { props: { component: GetEvents, props: PROPS } })

		expect(latestIntervalOf('getEvents')).toBe(POLL_INTERVAL_MS)
		expect(screen.getByText('Updates automatically')).toBeInTheDocument()
	})
})

describe('InputController Refresh widget in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
