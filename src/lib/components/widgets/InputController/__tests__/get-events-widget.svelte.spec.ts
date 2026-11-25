import '../../../../../app.css'

import { render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import Subject from '../get-events-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const PANE_WIDTH = '320px'
const POLL_INTERVAL_MS = 500

interface StubEvent {
	control: string
	event: string
	value: number
	time?: { seconds: bigint; nanos: number }
}

const state = vi.hoisted(
	(): {
		data: StubEvent[] | undefined
		error: Error | null
		queries: { method: string; options: unknown }[]
	} => ({ data: undefined, error: null, queries: [] })
)

vi.mock('@viamrobotics/sdk', () => ({
	InputControllerClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: string, options: unknown) => {
		state.queries.push({ method, options })
		return {
			get data() {
				return state.data
			},
			isLoading: false,
			get error() {
				return state.error
			},
		}
	}),
}))

const STUB_EVENTS: StubEvent[] = [
	{
		control: 'ButtonSouth',
		event: 'ButtonPress',
		value: 1,
		time: { seconds: 1_700_000_000n, nanos: 0 },
	},
	{ control: 'AbsoluteX', event: 'PositionChangeAbs', value: -0.18 },
	{ control: 'ButtonEast', event: 'ButtonRelease', value: 0 },
]

const PROPS = { partID: 'test-part', resourceName: 'test-input-controller' }

const renderSubject = () =>
	render(InWidgetsProvider, { props: { component: Subject, props: PROPS } })

const resolveOptions = (options: unknown) => (typeof options === 'function' ? options() : options)

describe('InputController GetEvents widget', () => {
	beforeEach(() => {
		state.data = STUB_EVENTS
		state.error = null
		state.queries = []
	})

	it('renders the GetEvents section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetEvents' })).toBeInTheDocument()
	})

	it('polls getEvents every 500 ms', () => {
		renderSubject()

		const query = state.queries.find(({ method }) => String(method) === 'getEvents')
		expect(resolveOptions(query?.options)).toEqual({ refetchInterval: POLL_INTERVAL_MS })
		expect(screen.getByText('Updates automatically')).toBeInTheDocument()
	})

	it('lists one row per control, sorted by name', () => {
		renderSubject()

		expect(screen.getAllByRole('term').map((term) => term.textContent?.trim())).toEqual([
			'AbsoluteX',
			'ButtonEast',
			'ButtonSouth',
		])
	})

	it('reads a button as Pressed or Released and an axis as its number', () => {
		renderSubject()

		expect(screen.getByText('Pressed')).toBeInTheDocument()
		expect(screen.getByText('Released')).toBeInTheDocument()
		expect(screen.getByText('-0.18')).toBeInTheDocument()
	})

	it('shows the last event name beside each row', () => {
		renderSubject()

		expect(screen.getByText(/PositionChangeAbs/u)).toBeInTheDocument()
		expect(screen.getByText(/ButtonPress/u)).toBeInTheDocument()
	})

	it('shows a dash in a group named Events when no event has been sent', () => {
		state.data = []

		renderSubject()

		expect(screen.getByRole('group', { name: 'Events' }).textContent?.trim()).toBe('-')
		expect(screen.queryByRole('term')).not.toBeInTheDocument()
	})

	it('shows a dash before the first response', () => {
		state.data = undefined

		renderSubject()

		expect(screen.getByRole('group', { name: 'Events' }).textContent?.trim()).toBe('-')
	})

	it("shows the query error in the section's error indicator", () => {
		state.error = new Error('events unavailable')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'GetEvents: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})

describe('InputController GetEvents widget in a 320 px pane', () => {
	beforeEach(() => {
		state.data = STUB_EVENTS
		state.error = null
	})

	it('does not scroll horizontally', () => {
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
