import '../../../../../app.css'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../trigger-event-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

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

	it('disables Execute with a hint until a control is named', async () => {
		renderSubject()

		expect(getExecute()).toBeDisabled()
		expect(getExecute()).toHaveAccessibleDescription('Enter a control name.')
		expect(screen.getByRole('textbox', { name: 'Control' })).toHaveAccessibleDescription(
			'Enter a control name.'
		)
		await userEvent.type(screen.getByRole('textbox', { name: 'Control' }), 'ButtonSouth')
		expect(getExecute()).toBeEnabled()
		expect(getExecute()).not.toHaveAttribute('aria-describedby')
	})

	it('sends one ButtonPress with value 0 and a time by default', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Control' }), ' ButtonSouth ')
		await userEvent.click(getExecute())

		expect(state.mutate).toHaveBeenCalledTimes(1)
		expect(sentEvent()).toMatchObject({ event: 'ButtonPress', control: 'ButtonSouth', value: 0 })
		expect(typeof sentEvent().time.seconds).toBe('bigint')
	})

	it('sends the chosen event and the typed value', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Control' }), 'AbsoluteX')
		await userEvent.click(screen.getByRole('combobox', { name: 'Event' }))
		await userEvent.click(await screen.findByRole('option', { name: 'PositionChangeAbs' }))
		const value = screen.getByRole('spinbutton', { name: 'Value' })
		await userEvent.clear(value)
		await userEvent.type(value, '0.5')
		await userEvent.click(getExecute())

		expect(sentEvent()).toMatchObject({
			event: 'PositionChangeAbs',
			control: 'AbsoluteX',
			value: 0.5,
		})
	})

	it('holds back Execute for a value outside -1 to 1', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Control' }), 'AbsoluteX')
		const value = screen.getByRole('spinbutton', { name: 'Value' })
		await userEvent.clear(value)
		await userEvent.type(value, '5')

		expect(getExecute()).toBeDisabled()
		expect(getExecute()).toHaveAccessibleDescription('Enter a value from -1 to 1.')
		expect(value).toHaveAccessibleDescription('Enter a value from -1 to 1.')
		expect(state.mutate).not.toHaveBeenCalled()
	})

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
