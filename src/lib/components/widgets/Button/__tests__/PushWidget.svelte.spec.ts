import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../PushWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const state = vi.hoisted(
	(): {
		mutateAsync: Mock
		succeed: () => void
		fail: () => void
		mutationError: Error | null
	} => ({
		mutateAsync: vi.fn(),
		succeed: () => {},
		fail: () => {},
		mutationError: null,
	})
)

vi.mock('@viamrobotics/sdk', () => ({
	ButtonClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutateAsync: (...args: unknown[]) => state.mutateAsync(...args),
		isPending: false,
		get error() {
			return state.mutationError
		},
	})),
}))

const holdUntilSettled = () =>
	new Promise<void>((resolve, reject) => {
		state.succeed = resolve
		state.fail = () => {
			reject(new Error('button unreachable'))
		}
	})

const statusLine = () => screen.getByTestId('status-line')

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-button' },
	})

describe('Button Push widget', () => {
	beforeEach(() => {
		state.mutateAsync = vi.fn(holdUntilSettled)
		state.mutationError = null
	})

	it('renders the Push section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Push' })).toBeInTheDocument()
	})

	it('sends one Push with no arguments on a press', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Push' }))

		expect(state.mutateAsync).toHaveBeenCalledTimes(1)
		expect(state.mutateAsync).toHaveBeenCalledWith([])
	})

	it('ignores a press while a Push is in flight', async () => {
		renderSubject()
		const button = screen.getByRole('button', { name: 'Push' })

		await userEvent.click(button)
		await userEvent.click(button)
		await userEvent.click(button)

		expect(state.mutateAsync).toHaveBeenCalledTimes(1)
	})

	it('reads disabled and says why while a Push is in flight', async () => {
		renderSubject()
		const button = screen.getByRole('button', { name: 'Push' })

		await userEvent.click(button)

		expect(button).toHaveAttribute('aria-disabled', 'true')
		expect(button).not.toHaveAttribute('disabled')
		expect(button).toHaveAccessibleDescription('Wait for the push in flight to finish.')
		expect(button).not.toHaveAttribute('aria-busy')
	})

	it('announces Pushing while in flight', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Push' }))

		expect(statusLine()).toHaveTextContent('Pushing')
	})

	it('announces Pushed when the Push succeeds', async () => {
		renderSubject()
		await userEvent.click(screen.getByRole('button', { name: 'Push' }))

		state.succeed()

		await vi.waitFor(() => {
			expect(statusLine()).toHaveTextContent('Pushed')
		})
	})

	it('announces Push failed when the Push fails, and takes a press again', async () => {
		renderSubject()
		const button = screen.getByRole('button', { name: 'Push' })
		await userEvent.click(button)

		state.fail()

		await vi.waitFor(() => {
			expect(statusLine()).toHaveTextContent('Push failed')
		})
		expect(button).not.toHaveAttribute('aria-disabled')
	})

	it('takes a press again once the Push settles', async () => {
		renderSubject()
		const button = screen.getByRole('button', { name: 'Push' })
		await userEvent.click(button)

		state.succeed()
		await vi.waitFor(() => {
			expect(button).not.toHaveAttribute('aria-disabled')
		})
		await userEvent.click(button)

		expect(state.mutateAsync).toHaveBeenCalledTimes(2)
	})

	it('clears the busy cue once the Push settles, with no success mark', async () => {
		renderSubject()
		const button = screen.getByRole('button', { name: 'Push' })
		await userEvent.click(button)

		state.succeed()
		await vi.waitFor(() => {
			expect(button).not.toHaveAttribute('aria-disabled')
		})

		expect(button.childElementCount, 'a cue or mark left inside the button').toBe(0)
	})

	it("shows the Push error in the section's error indicator", async () => {
		state.mutationError = new Error('button unreachable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'Push: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/button unreachable/iu)).toBeInTheDocument()
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

describe('Button Push widget in a 320 px pane', () => {
	beforeEach(() => {
		state.mutateAsync = vi.fn(holdUntilSettled)
		state.mutationError = null
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
