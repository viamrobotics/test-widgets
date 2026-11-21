import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../quick-move-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

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

const renderSubject = (props: Partial<Parameters<typeof render<typeof Subject>>[1]> = {}) =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-servo', ...props },
	})

describe('Servo Quick move widget', () => {
	beforeEach(() => {
		state.moveMutate = vi.fn()
		state.error = null
	})

	it('renders the Quick move section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Quick move' })).toBeInTheDocument()
	})

	it('sends one Move to the stepped position when a stepper is pressed', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: /^\+5°,/u }))

		expect(state.moveMutate).toHaveBeenCalledTimes(1)
		expect(state.moveMutate).toHaveBeenCalledWith([50])
	})

	it('steps by the chosen Step', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('combobox', { name: 'Step' }))
		await userEvent.click(screen.getByRole('option', { name: '10°' }))
		await userEvent.click(screen.getByRole('button', { name: /^−10°,/u }))

		expect(state.moveMutate).toHaveBeenCalledWith([35])
	})

	it('clamps a step to the configured minimum and maximum', async () => {
		renderSubject({ minDegrees: 44, maxDegrees: 47 })

		await userEvent.click(screen.getByRole('button', { name: /^\+5°,/u }))
		await userEvent.click(screen.getByRole('button', { name: /^−5°,/u }))

		expect(state.moveMutate).toHaveBeenNthCalledWith(1, [47])
		expect(state.moveMutate).toHaveBeenNthCalledWith(2, [44])
	})

	it('steps freely between 0 and 180 with no configured range', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: /^−5°,/u }))

		expect(state.moveMutate).toHaveBeenCalledWith([40])
	})

	it('ignores an invalid pair', async () => {
		renderSubject({ minDegrees: 100, maxDegrees: 50 })

		await userEvent.click(screen.getByRole('button', { name: /^\+5°,/u }))

		expect(state.moveMutate).toHaveBeenCalledWith([50])
	})

	it("shows the move error in the section's error indicator", () => {
		state.error = new Error('servo refused to move')

		renderSubject()

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
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

describe('Servo Quick move widget in a 320 px pane', () => {
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
