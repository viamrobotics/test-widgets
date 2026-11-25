import '../../../../../app.css'

import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import Subject from '../reset-position-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const PANE_WIDTH = '320px'

const state = vi.hoisted(
	(): { calls: [string, unknown[]][]; release: (() => void) | undefined; error: Error | null } => ({
		calls: [],
		release: undefined,
		error: null,
	})
)

vi.mock('@viamrobotics/sdk', () => ({
	EncoderClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn((_client: unknown, method: string) => ({
		mutateAsync: (args: unknown[]) => {
			state.calls.push([method, args])
			return new Promise<void>((resolve) => {
				state.release = resolve
			})
		},
		get error() {
			return state.error
		},
	})),
}))

const renderSubject = () =>
	render(InWidgetsProvider, {
		props: { component: Subject, props: { partID: 'test-part', resourceName: 'test-encoder' } },
	})

describe('Encoder ResetPosition widget', () => {
	beforeEach(() => {
		state.calls = []
		state.release = undefined
		state.error = null
	})

	it('renders the ResetPosition section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'ResetPosition' })).toBeInTheDocument()
	})

	it('calls the resetPosition mutation with no arguments when Reset to zero is pressed', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Reset to zero' }))

		expect(state.calls).toEqual([['resetPosition', []]])
	})

	it('marks the button busy while the reset is in flight', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Reset to zero' }))

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Reset to zero' })).toHaveAttribute(
				'aria-busy',
				'true'
			)
		})
		expect(screen.getByText('Resetting')).toBeInTheDocument()
	})

	it('disables the button while the reset is in flight, so a second press sends no second reset', async () => {
		renderSubject()
		const button = screen.getByRole('button', { name: 'Reset to zero' })

		await userEvent.click(button)
		await waitFor(() => {
			expect(button).toBeDisabled()
		})
		await userEvent.click(button)

		expect(state.calls).toHaveLength(1)
	})

	it('enables the button again once the reset settles', async () => {
		renderSubject()
		const button = screen.getByRole('button', { name: 'Reset to zero' })
		await userEvent.click(button)
		await waitFor(() => {
			expect(button).toBeDisabled()
		})

		state.release?.()

		await waitFor(() => {
			expect(button).toBeEnabled()
		})
	})

	it('carries no icon at rest, since only Execute takes the play icon', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'Reset to zero' }).querySelector('svg')).toBeNull()
	})

	it('leaves the button enabled when no reset is in flight', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'Reset to zero' })).toBeEnabled()
	})

	it("shows the mutation error in the section's error indicator", () => {
		state.error = new Error('encoder refused to reset')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'ResetPosition: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})

describe('Encoder ResetPosition widget in a 320 px pane', () => {
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
