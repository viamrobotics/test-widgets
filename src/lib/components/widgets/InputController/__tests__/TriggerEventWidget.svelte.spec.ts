import '../../../../../app.css'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../TriggerEventWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const PANE_WIDTH = '320px'

const state = vi.hoisted((): { mutate: Mock; error: Error | null; methods: string[] } => ({
	mutate: vi.fn(),
	error: null,
	methods: [],
}))

vi.mock('@viamrobotics/sdk', () => ({
	InputControllerClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn((_client: unknown, method: string) => {
		state.methods.push(method)
		return {
			mutate: state.mutate,
			isPending: false,
			get error() {
				return state.error
			},
		}
	}),
}))

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-input-controller' } })

const getExecute = () => screen.getByRole('button', { name: /execute/iu })

const sentEvent = () => {
	const [[event]] = state.mutate.mock.calls[0]
	return event
}

describe('InputController TriggerEvent widget', () => {
	beforeEach(() => {
		state.mutate = vi.fn()
		state.error = null
		state.methods = []
	})

	it('renders the TriggerEvent section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'TriggerEvent' })).toBeInTheDocument()
		expect(state.methods.some((method) => String(method) === 'triggerEvent')).toBe(true)
	})

	it('holds back Execute with a reason until a control is named', async () => {
		renderSubject()

		expect(getExecute()).toHaveAttribute('aria-disabled', 'true')
		expect(getExecute()).not.toHaveAttribute('disabled')
		expect(getExecute()).not.toHaveAttribute('aria-busy')
		expect(getExecute()).toHaveAccessibleDescription('Enter a control name.')
		expect(screen.getByRole('textbox', { name: 'Control' })).toHaveAccessibleDescription(
			'Enter a control name.'
		)

		await userEvent.click(getExecute())
		expect(state.mutate).not.toHaveBeenCalled()

		await userEvent.type(screen.getByRole('textbox', { name: 'Control' }), 'ButtonSouth')
		expect(getExecute()).not.toHaveAttribute('aria-disabled')
		expect(getExecute()).not.toHaveAttribute('aria-describedby')
	})

	it('sends one ButtonPress with value 0 and the current time by default', async () => {
		renderSubject()
		const before = Date.now()

		await userEvent.type(screen.getByRole('textbox', { name: 'Control' }), ' ButtonSouth ')
		await userEvent.click(getExecute())

		expect(state.mutate).toHaveBeenCalledTimes(1)
		expect(sentEvent()).toMatchObject({ event: 'ButtonPress', control: 'ButtonSouth', value: 0 })
		const sentMs = Number(sentEvent().time.seconds) * 1000 + sentEvent().time.nanos / 1_000_000
		expect(sentMs).toBeGreaterThanOrEqual(before)
		expect(sentMs).toBeLessThanOrEqual(Date.now())
	})

	it('sends a typed event name the API does not list, and any finite value', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Control' }), 'AbsoluteX')
		const event = screen.getByRole('combobox', { name: 'Event' })
		await userEvent.clear(event)
		await userEvent.type(event, 'CustomEvent')
		const value = screen.getByRole('spinbutton', { name: 'Value' })
		await userEvent.clear(value)
		await userEvent.type(value, '5')
		await userEvent.click(getExecute())

		expect(sentEvent()).toMatchObject({ event: 'CustomEvent', control: 'AbsoluteX', value: 5 })
	})

	it('offers the nine event names the API lists', () => {
		renderSubject()

		const event = screen.getByRole('combobox', { name: 'Event' })
		const list = document.querySelector(`#${CSS.escape(event.getAttribute('list') ?? '')}`)
		const names = [...(list?.querySelectorAll('option') ?? [])].map((option) => option.value)

		expect(names).toEqual([
			'AllEvents',
			'Connect',
			'Disconnect',
			'ButtonPress',
			'ButtonRelease',
			'ButtonHold',
			'ButtonChange',
			'PositionChangeAbs',
			'PositionChangeRel',
		])
	})

	it('holds back Execute for an empty event name', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Control' }), 'AbsoluteX')
		await userEvent.clear(screen.getByRole('combobox', { name: 'Event' }))

		expect(getExecute()).toHaveAccessibleDescription('Enter an event name.')
		await userEvent.click(getExecute())
		expect(state.mutate).not.toHaveBeenCalled()
	})

	it('holds back Execute for an empty value', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Control' }), 'AbsoluteX')
		const value = screen.getByRole('spinbutton', { name: 'Value' })
		await userEvent.clear(value)

		expect(getExecute()).toHaveAttribute('aria-disabled', 'true')
		expect(getExecute()).toHaveAccessibleDescription('Enter a value.')
		expect(value).toHaveAccessibleDescription('Enter a value.')
		await userEvent.click(getExecute())
		expect(state.mutate).not.toHaveBeenCalled()
	})

	it('sends the typed time', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Control' }), 'ButtonSouth')
		await userEvent.type(screen.getByRole('textbox', { name: 'Time' }), '2026-01-31T10:00:00.250Z')
		await userEvent.click(getExecute())

		expect(sentEvent().time).toEqual({
			seconds: BigInt(Date.UTC(2026, 0, 31, 10) / 1000),
			nanos: 250_000_000,
		})
	})

	it('sends a typed time with no seconds', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Control' }), 'ButtonSouth')
		await userEvent.type(screen.getByRole('textbox', { name: 'Time' }), '2026-01-31T10:05Z')
		await userEvent.click(getExecute())

		expect(sentEvent().time).toEqual({
			seconds: BigInt(Date.UTC(2026, 0, 31, 10, 5) / 1000),
			nanos: 0,
		})
	})

	it.each(['soon', '1', '2026-01-31T10:00:00', '2026-02-30T10:00:00Z', '2026-01-31T24:00:00Z'])(
		'holds back Execute for the time "%s"',
		async (text) => {
			renderSubject()

			await userEvent.type(screen.getByRole('textbox', { name: 'Control' }), 'ButtonSouth')
			await userEvent.type(screen.getByRole('textbox', { name: 'Time' }), text)

			expect(getExecute()).toHaveAccessibleDescription(
				'Enter a time such as 2026-01-31T10:00:00Z, or leave it empty.'
			)
			await userEvent.click(getExecute())
			expect(state.mutate).not.toHaveBeenCalled()
		}
	)

	it("shows the mutation error in the section's error indicator", () => {
		state.error = new Error('trigger refused')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'TriggerEvent: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})

describe('InputController TriggerEvent widget in a 320 px pane', () => {
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
