import { render, screen } from '@testing-library/svelte'
import { fireEvent } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-manual-mode-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const { state } = vi.hoisted(() => {
	const hoistedState: {
		supportManualMode: boolean
		manualMode: boolean | undefined
		error: Error | null
	} = { supportManualMode: true, manualMode: true, error: null }
	return { state: hoistedState }
})

vi.mock('@viamrobotics/sdk', () => ({
	ArmClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: string) => {
		if (method === 'getProperties') {
			return {
				data: { supportManualMode: state.supportManualMode },
				isLoading: false,
				isError: false,
				error: null,
			}
		}
		return {
			data: state.manualMode,
			isLoading: false,
			isError: state.error !== null,
			error: state.error,
		}
	}),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-arm' },
	})

describe('Arm GetManualMode widget', () => {
	beforeEach(() => {
		vi.mocked(createResourceQuery).mockClear()
		state.supportManualMode = true
		state.manualMode = true
		state.error = null
	})

	it('renders the GetManualMode section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetManualMode' })).toBeInTheDocument()
	})

	it('reads getProperties once', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getProperties', {
			refetchInterval: false,
		})
	})

	it('shows On when the arm is in manual mode', () => {
		renderSubject()

		expect(screen.getByRole('group', { name: 'Manual mode' })).toHaveTextContent('On')
	})

	it('shows Off when the arm is not in manual mode', () => {
		state.manualMode = false

		renderSubject()

		expect(screen.getByRole('group', { name: 'Manual mode' })).toHaveTextContent('Off')
	})

	it('shows - when the arm does not support manual mode', () => {
		state.supportManualMode = false
		state.manualMode = undefined

		renderSubject()

		expect(screen.getByRole('group', { name: 'Manual mode' })).toHaveTextContent('-')
	})

	it('names the unsupported reason from the group, with no focus stop on the dash', () => {
		state.supportManualMode = false
		state.manualMode = undefined

		renderSubject()

		const group = screen.getByRole('group', { name: 'Manual mode' })
		expect(screen.getByText('This arm does not support manual mode.')).toBeVisible()
		expect(group).toHaveAccessibleDescription('This arm does not support manual mode.')
		expect(group.querySelector('[tabindex]')).toBeNull()
	})

	it('draws no unsupported hint when the arm supports manual mode', () => {
		renderSubject()

		expect(screen.queryByText('This arm does not support manual mode.')).not.toBeInTheDocument()
	})

	it('labels the dot with the concept, not the value', () => {
		renderSubject()

		expect(screen.getByRole('img', { name: 'Manual mode' })).toBeInTheDocument()
		expect(screen.getAllByText('On')).toHaveLength(1)
	})

	it('polls getManualMode every second, only when supported', () => {
		renderSubject()

		const call = vi
			.mocked(createResourceQuery)
			.mock.calls.find(([, method]) => String(method) === 'getManualMode')
		const options = call?.[2]
		if (typeof options !== 'function') throw new Error('Expected an options function')

		expect(options()).toEqual({ refetchInterval: 1000, enabled: true })
	})

	it("shows the query error in the section's error indicator", async () => {
		state.error = new Error('arm manual mode unreadable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetManualMode: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/arm manual mode unreadable/iu)).toBeInTheDocument()
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

describe('Arm GetManualMode widget in a 320 px pane', () => {
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
