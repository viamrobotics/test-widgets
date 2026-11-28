import { fireEvent, render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../PwmWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

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
	state.mutate = vi.fn((_args: unknown, options?: { onSuccess?: (value: number) => void }) => {
		options?.onSuccess?.(state.result)
	})
	state.error = null
	state.result = 0
}

describe('Board PWM widget', () => {
	beforeEach(resetState)

	it('renders the PWM section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'PWM' })).toBeInTheDocument()
	})

	it('draws a Pin field', () => {
		renderSubject()

		expect(screen.getByRole('textbox', { name: 'Pin' })).toBeInTheDocument()
	})

	it('disables Get until a pin is typed', async () => {
		renderSubject()
		const get = screen.getByRole('button', { name: 'Get' })

		expect(get).toBeDisabled()
		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '11')

		expect(get).toBeEnabled()
	})

	it('shows - with its % suffix before any Get', () => {
		renderSubject()

		expect(
			within(screen.getByRole('group', { name: 'Duty cycle' })).getByRole('status')
		).toHaveTextContent('- %')
	})

	it('sends the typed pin and shows the value with its unit', async () => {
		state.result = 0.375

		renderSubject()
		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '11')
		await userEvent.click(screen.getByRole('button', { name: 'Get' }))

		expect(state.mutate).toHaveBeenCalledWith(['11'], expect.anything())
		expect(
			within(screen.getByRole('group', { name: 'Duty cycle' })).getByRole('status')
		).toHaveTextContent('37.50 %')
	})

	it('keeps Get disabled for a whitespace-only pin', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '   ')

		expect(screen.getByRole('button', { name: 'Get' })).toBeDisabled()
	})

	it('clears the reading when the pin changes', async () => {
		state.result = 0.375
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '11')
		await userEvent.click(screen.getByRole('button', { name: 'Get' }))
		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '2')

		expect(screen.getAllByRole('status')[0]).toHaveTextContent('- %')
	})

	it('draws no Pin field and sends the passed pin', async () => {
		renderSubject('7')

		expect(screen.queryByRole('textbox', { name: 'Pin' })).not.toBeInTheDocument()
		await userEvent.click(screen.getByRole('button', { name: 'Get' }))

		expect(state.mutate).toHaveBeenCalledWith(['7'], expect.anything())
	})

	it('keeps the widget with its button disabled and the hint for an empty passed pin', () => {
		renderSubject('')

		const button = screen.getByRole('button', { name: 'Get' })
		expect(screen.getByRole('heading', { name: 'PWM' })).toBeInTheDocument()
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
		await fireEvent.focusIn(screen.getByRole('button', { name: 'PWM: 1 error, copy to clipboard' }))

		expect(screen.getByText(/board refused/iu)).toBeInTheDocument()
	})
})

const PANE_WIDTH = '320px'

describe('Board PWM widget in a 320 px pane', () => {
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
		state.result = 0.375
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
