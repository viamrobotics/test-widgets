import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../set-manual-mode-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const { mutate, state } = vi.hoisted(() => {
	const hoistedState: { error: Error | null; supportManualMode: boolean } = {
		error: null,
		supportManualMode: true,
	}
	return { mutate: vi.fn(), state: hoistedState }
})

vi.mock('@viamrobotics/sdk', () => ({
	ArmClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: { supportManualMode: state.supportManualMode },
		isLoading: false,
		isError: false,
		error: null,
	})),
	createResourceMutation: vi.fn(() => ({
		mutate,
		isPending: false,
		error: state.error,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-arm' },
	})

describe('Arm SetManualMode widget', () => {
	beforeEach(() => {
		mutate.mockClear()
		vi.mocked(createResourceQuery).mockClear()
		state.error = null
		state.supportManualMode = true
	})

	it('renders the SetManualMode section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'SetManualMode' })).toBeInTheDocument()
	})

	it('sends the held values only when Execute is pressed', async () => {
		renderSubject()

		expect(mutate).not.toHaveBeenCalled()

		await fireEvent.click(screen.getByRole('button', { name: 'Execute' }))

		expect(mutate).toHaveBeenCalledTimes(1)
		expect(mutate).toHaveBeenCalledWith([true, 90], {})
	})

	it('reads getProperties once', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getProperties', {
			refetchInterval: false,
		})
	})

	it('holds back Execute for a negative duration, with the message named by the field', async () => {
		renderSubject()

		const field = screen.getByRole('spinbutton', { name: 'Enabled for' })
		await fireEvent.input(field, { target: { value: '-5' } })

		expect(screen.getByText('Enter a duration of 0 seconds or more.')).toBeVisible()
		expect(field).toHaveAccessibleDescription(
			expect.stringContaining('Enter a duration of 0 seconds or more.')
		)
		expect(screen.getByRole('button', { name: 'Execute' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Execute' })).toHaveAccessibleDescription(
			'Enter a duration of 0 seconds or more.'
		)
		expect(mutate).not.toHaveBeenCalled()
	})

	it('draws Execute as a compact button', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'Execute' })).toHaveClass('button', 'button-compact')
	})

	it('sends false when manual mode is unchecked', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('checkbox', { name: 'Manual mode' }))
		await fireEvent.click(screen.getByRole('button', { name: 'Execute' }))

		expect(mutate).toHaveBeenCalledWith([false, 90], {})
	})

	it('disables every control when the arm does not support manual mode', () => {
		state.supportManualMode = false

		renderSubject()

		expect(screen.getByRole('button', { name: 'Execute' })).toBeDisabled()
		expect(screen.getByRole('checkbox', { name: 'Manual mode' })).toBeDisabled()
	})

	it('names the unsupported reason from the group and Execute', () => {
		state.supportManualMode = false

		renderSubject()

		const reason = 'This arm does not support manual mode.'
		expect(screen.getByText(reason)).toBeVisible()
		expect(screen.getByRole('group', { name: 'Manual mode' })).toHaveAccessibleDescription(reason)
		expect(screen.getByRole('button', { name: 'Execute' })).toHaveAccessibleDescription(reason)
	})

	it('draws no unsupported hint when the arm supports manual mode', () => {
		renderSubject()

		expect(screen.queryByText('This arm does not support manual mode.')).not.toBeInTheDocument()
		expect(screen.getByRole('group', { name: 'Manual mode' })).toHaveAccessibleDescription('')
	})

	it("shows the mutation error in the section's error indicator", async () => {
		state.error = new Error('arm refused manual mode')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'SetManualMode: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/arm refused manual mode/iu)).toBeInTheDocument()
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

describe('Arm SetManualMode widget in a 320 px pane', () => {
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
