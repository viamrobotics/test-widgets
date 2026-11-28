import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../SetPwmWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const state = vi.hoisted((): { mutateAsync: Mock; error: Error | null } => ({
	mutateAsync: vi.fn(),
	error: null,
}))

vi.mock('@viamrobotics/sdk', () => ({
	BoardClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutateAsync: state.mutateAsync,
		isPending: false,
		get error() {
			return state.error
		},
	})),
}))

const renderSubject = (pin?: string) =>
	render(InWidgetsProvider, {
		props: {
			component: Subject,
			props: {
				partID: 'test-part',
				resourceName: 'test-board',
				...(pin === undefined ? {} : { pin }),
			},
		},
	})

const PIN_HINT = 'Enter a pin in the Pin field above.'

const resetState = () => {
	state.mutateAsync = vi.fn(() => Promise.resolve())
	state.error = null
}

describe('Board SetPWM widget', () => {
	beforeEach(resetState)

	it('renders the SetPWM section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'SetPWM' })).toBeInTheDocument()
	})

	it('draws a Pin field', () => {
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

		expect(state.mutateAsync).toHaveBeenCalledWith(['11', 0.25])
	})

	it('shows the Duty cycle unit as a suffix', () => {
		renderSubject()

		expect(screen.getByText('%')).toBeInTheDocument()
	})

	it('holds back Execute for an invalid duty cycle', async () => {
		renderSubject()
		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '11')

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

	it('keeps Execute disabled for a whitespace-only pin', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '   ')

		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
	})

	it('draws no Pin field and sends the passed pin', async () => {
		renderSubject('7')

		expect(screen.queryByRole('textbox', { name: 'Pin' })).not.toBeInTheDocument()
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutateAsync).toHaveBeenCalledWith(['7', 0.5])
	})

	it('keeps the widget with its button disabled and the hint for an empty passed pin', () => {
		renderSubject('')

		const button = screen.getByRole('button', { name: /execute/iu })
		expect(screen.getByRole('heading', { name: 'SetPWM' })).toBeInTheDocument()
		expect(screen.queryByRole('textbox', { name: 'Pin' })).not.toBeInTheDocument()
		expect(screen.getByText(PIN_HINT)).toBeInTheDocument()
		expect(button).toBeDisabled()
		expect(button).toHaveAccessibleDescription(PIN_HINT)
	})

	it('shows no hint for a passed pin', () => {
		renderSubject('7')

		expect(screen.queryByText(PIN_HINT)).not.toBeInTheDocument()
	})

	it("shows the mutation error in the section's error indicator", async () => {
		state.error = new Error('board refused')

		renderSubject()
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
