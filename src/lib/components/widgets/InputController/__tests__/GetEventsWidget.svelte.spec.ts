import '../../../../../app.css'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetEventsWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const PANE_WIDTH = '320px'

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
		localStorage.clear()
	})

	it('renders the GetEvents section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetEvents' })).toBeInTheDocument()
	})

	it('polls getEvents every second until Pause is pressed', async () => {
		renderSubject()

		const query = state.queries.find(({ method }) => String(method) === 'getEvents')
		expect(resolveOptions(query?.options)).toEqual({ refetchInterval: 1000 })
		expect(screen.getByText('Updates')).toBeInTheDocument()

		await userEvent.click(screen.getByRole('button', { name: 'Pause' }))

		expect(resolveOptions(query?.options)).toEqual({ refetchInterval: false })
		expect(screen.getByText('Paused')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
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

	it('ties each value and its event line to the control name in the list', () => {
		renderSubject()

		for (const term of screen.getAllByRole('term')) {
			const group = term.parentElement
			expect(group?.parentElement?.tagName).toBe('DL')
			expect([...(group?.children ?? [])].map((child) => child.tagName)).toEqual(['DT', 'DD', 'DD'])
		}
		const [axis] = screen.getAllByRole('term')
		const details = [...(axis.parentElement?.querySelectorAll('dd') ?? [])]
		expect(details[0]?.textContent?.trim()).toBe('-0.18')
		expect(details[1]?.textContent).toContain('PositionChangeAbs')
		expect(axis).not.toHaveAttribute('title')
	})

	it('shows the last event name beside each row', () => {
		renderSubject()

		expect(screen.getByText(/PositionChangeAbs/u)).toBeInTheDocument()
		expect(screen.getByText(/ButtonPress/u)).toBeInTheDocument()
	})

	it('shows milliseconds from the event nanos, and a dash for an event with no time', () => {
		state.data = [
			{
				control: 'ButtonSouth',
				event: 'ButtonPress',
				value: 1,
				time: { seconds: 1_700_000_000n, nanos: 250_000_000 },
			},
			{ control: 'ButtonEast', event: 'ButtonRelease', value: 0 },
		]

		renderSubject()

		const [east, south] = screen.getAllByRole('term')
		const lastLine = (term: HTMLElement) =>
			[...(term.parentElement?.querySelectorAll('dd') ?? [])].at(-1)?.textContent
		expect(lastLine(south)).toMatch(/ButtonPress\s+\S+\.250\s*$/u)
		expect(lastLine(east)).toMatch(/ButtonRelease\s+-\s*$/u)
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
