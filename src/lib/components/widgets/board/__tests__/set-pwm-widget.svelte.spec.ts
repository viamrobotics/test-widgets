import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../set-pwm-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted((): { mutate: Mock; error: Error | null; result: number } => ({
	mutate: vi.fn(),
	error: null,
	result: 0,
}))

vi.mock('@viamrobotics/sdk', () => ({
	BoardClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: state.mutate,
		isPending: false,
		get error() {
			return state.error
		},
	})),
}))

const PIN_HINT = 'Enter a pin in the Pin field above.'

const renderSubject = (pin?: string) =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-board', pin },
	})

const resetState = () => {
	state.mutate = vi.fn((_args: unknown, options?: { onSuccess?: (value: number) => void }) => {
		options?.onSuccess?.(state.result)
	})
	state.error = null
	state.result = 0
}

describe('Board SetPWM widget', () => {
	beforeEach(resetState)

	it('renders the SetPWM section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'SetPWM' })).toBeInTheDocument()
	})

	it('draws its own Pin field when no pin is passed', () => {
		renderSubject()

		expect(screen.getByRole('textbox', { name: 'Pin' })).toBeInTheDocument()
	})

	it('disables Execute until a pin is typed', async () => {
		renderSubject()
		const execute = screen.getByRole('button', { name: /execute/iu })

		expect(execute).toBeDisabled()
		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '11')

		expect(execute).toBeEnabled()
	})

	it('sends the typed pin and the duty cycle as a 0 to 1 fraction', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '11')
		const input = screen.getByRole('spinbutton')
		await userEvent.clear(input)
		await userEvent.type(input, '25')
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutate).toHaveBeenCalledWith(['11', 0.25], {})
	})

	it('shows the Duty cycle unit as a suffix', () => {
		renderSubject()

		expect(screen.getByText('%')).toBeInTheDocument()
	})

	it('holds back Execute for an invalid duty cycle', async () => {
		renderSubject('11')

		const input = screen.getByRole('spinbutton')
		await userEvent.clear(input)
		await userEvent.type(input, '150')

		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
		expect(input).toHaveAttribute('aria-invalid', 'true')
		expect(input).toHaveAccessibleDescription(
			expect.stringContaining('Enter a duty cycle from 0 to 100 to execute.')
		)
		expect(screen.getByRole('button', { name: /execute/iu })).toHaveAccessibleDescription(
			'Enter a duty cycle from 0 to 100 to execute.'
		)
	})

	it('draws no Pin field and sends the passed pin', async () => {
		renderSubject('7')

		expect(screen.queryByRole('textbox', { name: 'Pin' })).not.toBeInTheDocument()
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutate).toHaveBeenCalledWith(['7', 0.5], {})
	})

	it('keeps the widget with Execute disabled and the hint for an empty passed pin', () => {
		renderSubject('')

		expect(screen.getByRole('heading', { name: 'SetPWM' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
		expect(screen.getByText(PIN_HINT)).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /execute/iu })).toHaveAccessibleDescription(PIN_HINT)
	})

	it('keeps Execute disabled for a whitespace-only pin', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '   ')

		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
	})

	it('shows no hint for a passed pin', () => {
		renderSubject('7')

		expect(screen.queryByText(PIN_HINT)).not.toBeInTheDocument()
	})

	it("shows the mutation error in the section's error indicator", async () => {
		state.error = new Error('board refused')

		renderSubject('7')
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'SetPWM: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/board refused/iu)).toBeInTheDocument()
	})
})

const PANE_WIDTH = '320px'

describe('Board SetPWM widget in a 320 px pane', () => {
	beforeEach(resetState)

	const renderInPane = () => {
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
		return { pane, root }
	}

	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally', () => {
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
