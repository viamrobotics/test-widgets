import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../MoveWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const state = vi.hoisted((): { moveMutate: Mock; error: Error | null } => ({
	moveMutate: vi.fn(),
	error: null,
}))

vi.mock('@viamrobotics/sdk', () => ({
	ServoClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: 45,
		isLoading: false,
		isSuccess: true,
		isError: false,
		error: null,
	})),
	createResourceMutation: vi.fn(() => ({
		mutate: state.moveMutate,
		mutateAsync: state.moveMutate,
		isPending: false,
		get error() {
			return state.error
		},
	})),
}))

const renderSubject = (props: { maxDegrees?: number } = {}) =>
	render(InWidgetsProvider, {
		props: {
			component: Subject,
			props: { partID: 'test-part', resourceName: 'test-servo', ...props },
		},
	})

const executeAt = async (angle: string) => {
	const field = screen.getByRole('spinbutton', { name: /desired angle/iu })
	await userEvent.clear(field)
	await userEvent.type(field, `${angle}{Tab}`)
	await userEvent.click(screen.getByRole('button', { name: /execute/iu }))
}

describe('Servo Move widget', () => {
	beforeEach(() => {
		state.moveMutate = vi.fn()
		state.error = null
	})

	it('renders the Move section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Move' })).toBeInTheDocument()
	})

	it('calls the move mutation when the form is submitted', async () => {
		renderSubject()

		const numericInput = screen.getByRole('spinbutton', { name: /desired angle/iu })
		await userEvent.clear(numericInput)
		await userEvent.type(numericInput, '90')
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.moveMutate).toHaveBeenCalledWith([90])
	})

	it('sends no move above 180° when the host gives no maximum', async () => {
		renderSubject()

		await executeAt('200')

		expect(state.moveMutate).not.toHaveBeenCalled()
	})

	it('sends a move above 180° up to the maximum the host gives', async () => {
		renderSubject({ maxDegrees: 270 })

		await executeAt('200')

		expect(state.moveMutate).toHaveBeenCalledWith([200])
	})

	it("shows the move error in the section's error indicator", () => {
		state.error = new Error('servo refused to move')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'Move: 1 error, copy to clipboard' })
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

describe('Servo Move widget in a 320 px pane', () => {
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
