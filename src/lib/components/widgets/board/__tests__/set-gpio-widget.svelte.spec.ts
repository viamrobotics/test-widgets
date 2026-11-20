import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../set-gpio-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted((): { mutate: Mock; error: Error | null } => ({
	mutate: vi.fn(),
	error: null,
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
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-board', pin },
	})

const MISSING_PIN_HINT = 'Enter a pin in the Pin field above.'

describe('Board SetGPIO widget', () => {
	beforeEach(() => {
		state.mutate = vi.fn()
		state.error = null
	})

	it('renders the SetGPIO section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'SetGPIO' })).toBeInTheDocument()
	})

	it('draws its own Pin field and sends the typed pin with the High level by default', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '11')
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutate).toHaveBeenCalledWith(['11', true])
	})

	it('sends false after Low is chosen', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '7')
		await fireEvent.click(screen.getByRole('radio', { name: 'Low' }))
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutate).toHaveBeenCalledWith(['7', false])
	})

	it('disables Execute with no hint while the own Pin field is empty', async () => {
		renderSubject()

		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
		expect(screen.queryByText(MISSING_PIN_HINT)).not.toBeInTheDocument()
		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '4')
		expect(screen.getByRole('button', { name: /execute/iu })).toBeEnabled()
	})

	it('keeps Execute disabled for a whitespace-only pin and sends the trimmed pin', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '   ')
		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '4 ')
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutate).toHaveBeenCalledWith(['4', true])
	})

	it('draws no Pin field and uses the pin prop', async () => {
		renderSubject('13')

		expect(screen.queryByRole('textbox', { name: 'Pin' })).not.toBeInTheDocument()
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutate).toHaveBeenCalledWith(['13', true])
	})

	it('disables Execute and shows the hint when the pin prop is empty', async () => {
		renderSubject('')

		const execute = screen.getByRole('button', { name: /execute/iu })
		expect(screen.getByRole('heading', { name: 'SetGPIO' })).toBeInTheDocument()
		expect(screen.getByText(MISSING_PIN_HINT)).toBeInTheDocument()
		expect(execute).toBeDisabled()
		expect(execute).toHaveAccessibleDescription(MISSING_PIN_HINT)
		expect(state.mutate).not.toHaveBeenCalled()
	})

	it("shows the mutation error in the section's error indicator", () => {
		state.error = new Error('pin is not writable')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'SetGPIO: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})

const PANE_WIDTH = '320px'

const renderInPane = () => {
	render(PaneSubject, { props: { widget: Subject } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

describe('Board SetGPIO widget in a 320 px pane', () => {
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
