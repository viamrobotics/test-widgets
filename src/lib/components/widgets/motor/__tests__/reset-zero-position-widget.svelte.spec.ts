import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../reset-zero-position-widget.svelte'
import PaneSubject from './motor-pane-width.spec.svelte'

const state = vi.hoisted(
	(): {
		mutate: Mock
		error: Error | null
		properties: { positionReporting: boolean } | undefined
	} => ({
		mutate: vi.fn(),
		error: null,
		properties: undefined,
	})
)

vi.mock('@viamrobotics/sdk', () => ({
	MotorClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		get data() {
			return state.properties
		},
		isLoading: false,
		error: null,
	})),
	createResourceMutation: vi.fn(() => ({
		mutate: state.mutate,
		isPending: false,
		get error() {
			return state.error
		},
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-motor' },
	})

describe('Motor ResetZeroPosition widget', () => {
	beforeEach(() => {
		state.mutate = vi.fn()
		state.error = null
		state.properties = { positionReporting: true }
	})

	it('renders the ResetZeroPosition section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'ResetZeroPosition' })).toBeInTheDocument()
	})

	it('calls the resetZeroPosition mutation with the offset when Execute is pressed', async () => {
		renderSubject()

		const numericInput = screen.getByRole('spinbutton')
		await userEvent.clear(numericInput)
		await userEvent.type(numericInput, '2.5')
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutate).toHaveBeenCalledWith([2.5], {})
	})

	it('sends the default offset of zero', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutate).toHaveBeenCalledWith([0], {})
	})

	it('holds back Execute while the field is empty', async () => {
		renderSubject()

		await userEvent.clear(screen.getByRole('spinbutton'))

		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
	})

	it('disables the field and Execute when the motor does not report its position', () => {
		state.properties = { positionReporting: false }

		renderSubject()

		expect(screen.getByRole('spinbutton')).toBeDisabled()
		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
		expect(screen.getByText('This motor does not report its position.')).toBeVisible()
		expect(screen.getByRole('spinbutton')).toHaveAccessibleDescription(
			expect.stringContaining('This motor does not report its position.')
		)
		expect(screen.getByRole('button', { name: /execute/iu })).toHaveAccessibleDescription(
			'This motor does not report its position.'
		)
	})

	it('explains the empty field in a visible hint named by the field and Execute', async () => {
		renderSubject()

		await userEvent.clear(screen.getByRole('spinbutton'))

		expect(screen.getByText('Enter an offset to execute.')).toBeVisible()
		expect(screen.getByRole('spinbutton')).toHaveAccessibleDescription(
			expect.stringContaining('Enter an offset to execute.')
		)
		expect(screen.getByRole('button', { name: /execute/iu })).toHaveAccessibleDescription(
			'Enter an offset to execute.'
		)
	})

	it('shows no hint while Execute is enabled', () => {
		renderSubject()

		expect(screen.queryByText('Enter an offset to execute.')).not.toBeInTheDocument()
		expect(screen.queryByText('This motor does not report its position.')).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: /execute/iu })).not.toHaveAccessibleDescription()
	})

	it("shows the mutation error in the section's error indicator", () => {
		state.error = new Error('motor refused to reset')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'ResetZeroPosition: 1 error, copy to clipboard' })
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

describe('Motor ResetZeroPosition widget in a 320 px pane', () => {
	beforeEach(() => {
		state.mutate = vi.fn()
		state.error = null
		state.properties = { positionReporting: true }
	})

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
