import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../push.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

interface MutateOptions {
	onSettled?: () => void
}

const state = vi.hoisted(
	(): {
		mutate: Mock
		settle: (() => void) | undefined
		mutationError: Error | null
	} => ({
		mutate: vi.fn(),
		settle: undefined,
		mutationError: null,
	})
)

vi.mock('@viamrobotics/sdk', () => ({
	ButtonClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: state.mutate,
		isPending: false,
		get error() {
			return state.mutationError
		},
	})),
}))

const holdUntilSettled = (_args: unknown, options?: MutateOptions) => {
	state.settle = options?.onSettled
}

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-button' },
	})

describe('Button Push widget', () => {
	beforeEach(() => {
		state.mutate = vi.fn(holdUntilSettled)
		state.settle = undefined
		state.mutationError = null
	})

	it('renders the Push section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Push' })).toBeInTheDocument()
	})

	it('sends one Push with no arguments on a press', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Push' }))

		expect(state.mutate).toHaveBeenCalledTimes(1)
		expect(state.mutate).toHaveBeenCalledWith([], expect.anything())
	})

	it('ignores a press while a Push is in flight', async () => {
		renderSubject()
		const button = screen.getByRole('button', { name: 'Push' })

		await userEvent.click(button)
		await userEvent.click(button)
		await userEvent.click(button)

		expect(state.mutate).toHaveBeenCalledTimes(1)
	})

	it('marks the button busy while a Push is in flight', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Push' }))

		expect(screen.getByRole('button', { name: 'Push' })).toHaveAttribute('aria-busy', 'true')
	})

	it('takes a press again once the Push settles', async () => {
		renderSubject()
		const button = screen.getByRole('button', { name: 'Push' })
		await userEvent.click(button)

		state.settle?.()
		await userEvent.click(button)

		expect(state.mutate).toHaveBeenCalledTimes(2)
	})

	it('clears the busy cue once the Push settles, with no success mark', async () => {
		renderSubject()
		const button = screen.getByRole('button', { name: 'Push' })
		await userEvent.click(button)

		state.settle?.()
		await vi.waitFor(() => {
			expect(button).toHaveAttribute('aria-busy', 'false')
		})

		expect(button.childElementCount, 'a cue or mark left inside the button').toBe(0)
	})

	it("shows the Push error in the section's error indicator", async () => {
		state.mutationError = new Error('button unreachable')

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

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
		state.mutate = vi.fn(holdUntilSettled)
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
