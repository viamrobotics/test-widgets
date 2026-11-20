import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../get-gpio-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

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
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-board', pin },
	})

const MISSING_PIN_HINT = 'Enter a pin in the Pin field above.'

describe('Board GetGPIO widget', () => {
	beforeEach(() => {
		state.mutateAsync = vi.fn().mockResolvedValue(true)
		state.error = null
	})

	it('renders the GetGPIO section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetGPIO' })).toBeInTheDocument()
	})

	it('draws Get as a compact button', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'Get' })).toHaveClass('button', 'button-compact')
	})

	it('reads - before any Get', () => {
		renderSubject()

		expect(screen.getByRole('status')).toHaveTextContent('-')
		expect(state.mutateAsync).not.toHaveBeenCalled()
	})

	it('disables Get with no hint while the own Pin field is empty', async () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'Get' })).toBeDisabled()
		expect(screen.queryByText(MISSING_PIN_HINT)).not.toBeInTheDocument()
		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '4')
		expect(screen.getByRole('button', { name: 'Get' })).toBeEnabled()
	})

	it('keeps Get disabled for a whitespace-only pin and sends the trimmed pin', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '   ')
		expect(screen.getByRole('button', { name: 'Get' })).toBeDisabled()
		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '4 ')
		await userEvent.click(screen.getByRole('button', { name: 'Get' }))

		expect(state.mutateAsync).toHaveBeenCalledWith(['4'])
	})

	it('clears the reading when the pin changes', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '4')
		await userEvent.click(screen.getByRole('button', { name: 'Get' }))
		expect(await screen.findByText('High')).toBeInTheDocument()
		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '5')

		expect(screen.getByRole('status')).toHaveTextContent('-')
	})

	it('does not poll, so nothing is sent until Get is pressed', () => {
		renderSubject()

		expect(state.mutateAsync).not.toHaveBeenCalled()
	})

	it('sends the typed pin and shows High', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '11')
		await userEvent.click(screen.getByRole('button', { name: 'Get' }))

		expect(state.mutateAsync).toHaveBeenCalledWith(['11'])
		expect(await screen.findByText('High')).toBeInTheDocument()
	})

	it('labels the dot with the concept, not the state', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '4')
		await userEvent.click(screen.getByRole('button', { name: 'Get' }))

		expect(await screen.findByRole('img', { name: 'Pin state' })).toBeInTheDocument()
		expect(screen.getAllByText('High')).toHaveLength(1)
	})

	it('shows Low when the board reads false', async () => {
		state.mutateAsync = vi.fn().mockResolvedValue(false)
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '5')
		await userEvent.click(screen.getByRole('button', { name: 'Get' }))

		expect(await screen.findByText('Low')).toBeInTheDocument()
	})

	it('draws no Pin field and uses the pin prop', async () => {
		renderSubject('13')

		expect(screen.queryByRole('textbox', { name: 'Pin' })).not.toBeInTheDocument()
		await userEvent.click(screen.getByRole('button', { name: 'Get' }))

		expect(state.mutateAsync).toHaveBeenCalledWith(['13'])
	})

	it('disables Get and shows the hint when the pin prop is empty', () => {
		renderSubject('')

		const get = screen.getByRole('button', { name: 'Get' })
		expect(screen.getByRole('heading', { name: 'GetGPIO' })).toBeInTheDocument()
		expect(screen.getByText(MISSING_PIN_HINT)).toBeInTheDocument()
		expect(get).toBeDisabled()
		expect(get).toHaveAccessibleDescription(MISSING_PIN_HINT)
		expect(state.mutateAsync).not.toHaveBeenCalled()
	})

	it("shows the mutation error in the section's error indicator", () => {
		state.error = new Error('pin is not readable')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'GetGPIO: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})

	it('keeps - when the read fails', async () => {
		state.mutateAsync = vi.fn().mockRejectedValue(new Error('pin is not readable'))
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), '5')
		await userEvent.click(screen.getByRole('button', { name: 'Get' }))

		expect(screen.getByRole('status')).toHaveTextContent('-')
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

describe('Board GetGPIO widget in a 320 px pane', () => {
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
