import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../write-analog-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted((): { mutateAsync: Mock; mutate: Mock; error: Error | null } => ({
	mutateAsync: vi.fn(),
	mutate: vi.fn(),
	error: null,
}))

vi.mock('@viamrobotics/sdk', () => ({
	BoardClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn((_client: unknown, method: string) => ({
		mutate: (...args: unknown[]) => state.mutate(method, ...args),
		mutateAsync: (...args: unknown[]) => state.mutateAsync(method, ...args),
		isPending: false,
		get error() {
			return state.error
		},
	})),
}))

const EMPTY_PIN_HINT = 'Enter a pin in the Pin field above.'

const renderSubject = (pin?: string) =>
	render(Subject, {
		props: {
			partID: 'test-part',
			resourceName: 'test-board',
			...(pin === undefined ? {} : { pin }),
		},
	})

describe('Board WriteAnalog widget', () => {
	beforeEach(() => {
		state.mutate = vi.fn()
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

		expect(state.mutate).toHaveBeenCalledWith('writeAnalog', ['a1', 512], {})
	})

	it('disables Execute and shows the error state for a fractional value', async () => {
		renderSubject('a1')

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
		renderSubject('a1')

		expect(screen.getByRole('button', { name: /execute/iu })).toHaveClass(
			'button',
			'button-compact'
		)
	})

	it('keeps Execute disabled with no hint while its own Pin is empty', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
		expect(screen.queryByText(EMPTY_PIN_HINT)).not.toBeInTheDocument()
	})

	it('draws no Pin field and uses the pin prop when one is given', async () => {
		renderSubject('a2')

		expect(screen.queryByRole('textbox', { name: 'Pin' })).not.toBeInTheDocument()
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutate).toHaveBeenCalledWith('writeAnalog', ['a2', 0], {})
	})

	it('draws no Pin field and disables Execute with a hint when the pin prop is empty', () => {
		renderSubject('')

		const hint = screen.getByText(EMPTY_PIN_HINT)
		expect(screen.queryByRole('textbox', { name: 'Pin' })).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
		expect(screen.getByRole('button', { name: /execute/iu })).toHaveAttribute(
			'aria-describedby',
			hint.id
		)
		expect(hint.id).not.toBe('')
	})

	it('shows no hint when the pin prop is set', () => {
		renderSubject('a2')

		expect(screen.queryByText(EMPTY_PIN_HINT)).not.toBeInTheDocument()
	})

	it("shows the mutation error in the section's error indicator", () => {
		state.error = new Error('analog write failed')

		renderSubject('a1')

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
