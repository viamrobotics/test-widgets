import '../../../../../app.css'

import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../ResetPositionWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const PANE_WIDTH = '320px'

const state = vi.hoisted(
	(): {
		calls: [string, unknown[]][]
		release: (() => void) | undefined
		fail: ((error: Error) => void) | undefined
		error: Error | null
	} => ({
		calls: [],
		release: undefined,
		fail: undefined,
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
			return new Promise<void>((resolve, reject) => {
				state.release = resolve
				state.fail = reject
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
		state.fail = undefined
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

	it('holds the button back with a reason and no aria-busy while the reset is in flight', async () => {
		renderSubject()
		const button = screen.getByRole('button', { name: 'Reset to zero' })

		await userEvent.click(button)

		await waitFor(() => {
			expect(button).toHaveAttribute('aria-disabled', 'true')
		})
		expect(button).not.toHaveAttribute('aria-busy')
		expect(button).not.toHaveAttribute('disabled')
		expect(button).toHaveAccessibleDescription('Wait for the reset in flight to finish.')
		expect(screen.getByTestId('status-line')).toHaveTextContent('Resetting')
	})

	it('sends no second reset for a press made while one is in flight', async () => {
		renderSubject()
		const button = screen.getByRole('button', { name: 'Reset to zero' })

		await userEvent.click(button)
		await waitFor(() => {
			expect(button).toHaveAttribute('aria-disabled', 'true')
		})
		await userEvent.click(button)

		expect(state.calls).toHaveLength(1)
	})

	it('frees the button and reads Position reset once the reset settles', async () => {
		renderSubject()
		const button = screen.getByRole('button', { name: 'Reset to zero' })
		await userEvent.click(button)
		await waitFor(() => {
			expect(button).toHaveAttribute('aria-disabled', 'true')
		})

		state.release?.()

		await waitFor(() => {
			expect(button).not.toHaveAttribute('aria-disabled')
		})
		expect(screen.getByTestId('status-line')).toHaveTextContent('Position reset')
	})

	it('frees the button and reads Reset failed when the reset fails', async () => {
		renderSubject()
		const button = screen.getByRole('button', { name: 'Reset to zero' })
		await userEvent.click(button)
		await waitFor(() => {
			expect(button).toHaveAttribute('aria-disabled', 'true')
		})

		state.fail?.(new Error('encoder refused to reset'))

		await waitFor(() => {
			expect(screen.getByTestId('status-line')).toHaveTextContent('Reset failed')
		})
		expect(button).not.toHaveAttribute('aria-disabled')
	})

	it('carries no icon at rest, since only Execute takes the play icon', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'Reset to zero' }).querySelector('svg')).toBeNull()
	})

	it('does not hold the button back when no reset is in flight', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'Reset to zero' })).not.toHaveAttribute(
			'aria-disabled'
		)
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
