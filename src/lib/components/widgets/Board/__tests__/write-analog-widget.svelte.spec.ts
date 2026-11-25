import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import Subject from '../write-analog-widget.svelte'
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
	createResourceMutation: vi.fn((_client: unknown, method: string) => ({
		mutateAsync: (...args: unknown[]) => state.mutateAsync(method, ...args),
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

describe('Board WriteAnalog widget', () => {
	beforeEach(() => {
		state.mutateAsync = vi.fn(() => Promise.resolve())
		state.error = null
	})

	it('renders the WriteAnalog section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'WriteAnalog' })).toBeInTheDocument()
	})

	it('draws its own Pin field and sends that pin with the value', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), 'a1')
		const valueInput = screen.getByRole('spinbutton', { name: 'Value' })
		await userEvent.clear(valueInput)
		await userEvent.type(valueInput, '512')
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutateAsync).toHaveBeenCalledWith('writeAnalog', ['a1', 512])
	})

	it('disables Execute and shows the error state for a fractional value', async () => {
		renderSubject()
		await userEvent.type(screen.getByRole('textbox', { name: 'Pin' }), 'a1')

		const valueInput = screen.getByRole('spinbutton', { name: 'Value' })
		await userEvent.clear(valueInput)
		await userEvent.type(valueInput, '1.5')

		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
		expect(valueInput).toHaveAttribute('aria-invalid', 'true')
		expect(valueInput).toHaveAccessibleDescription('Enter a whole number to execute.')
		expect(screen.getByRole('button', { name: /execute/iu })).toHaveAccessibleDescription(
			'Enter a whole number to execute.'
		)
	})

	it('draws Execute as a compact button', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: /execute/iu })).toHaveClass(
			'button',
			'button-compact'
		)
	})

	it('keeps Execute disabled while the Pin field is empty', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
	})

	it('draws no Pin field and sends the passed pin', async () => {
		renderSubject('7')

		expect(screen.queryByRole('textbox', { name: 'Pin' })).not.toBeInTheDocument()
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutateAsync).toHaveBeenCalledWith('writeAnalog', ['7', 0])
	})

	it('keeps the widget with its button disabled and the hint for an empty passed pin', () => {
		renderSubject('')

		const button = screen.getByRole('button', { name: /execute/iu })
		expect(screen.getByRole('heading', { name: 'WriteAnalog' })).toBeInTheDocument()
		expect(screen.queryByRole('textbox', { name: 'Pin' })).not.toBeInTheDocument()
		expect(screen.getByText(PIN_HINT)).toBeInTheDocument()
		expect(button).toBeDisabled()
		expect(button).toHaveAccessibleDescription(PIN_HINT)
	})

	it('shows no hint for a passed pin', () => {
		renderSubject('7')

		expect(screen.queryByText(PIN_HINT)).not.toBeInTheDocument()
	})

	it("shows the mutation error in the section's error indicator", () => {
		state.error = new Error('analog write failed')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'WriteAnalog: 1 error, copy to clipboard' })
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

describe('Board WriteAnalog widget in a 320 px pane', () => {
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
