import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-number-of-positions-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted(
	(): { positions: [number, string[]] | undefined; error: Error | null } => ({
		positions: undefined,
		error: null,
	})
)

vi.mock('@viamrobotics/sdk', () => ({
	SwitchClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		get data() {
			return state.positions
		},
		isLoading: false,
		isError: false,
		get error() {
			return state.error
		},
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-switch' },
	})

describe('Switch GetNumberOfPositions widget', () => {
	beforeEach(() => {
		state.positions = [3, ['Low', 'Medium', 'High']]
		state.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetNumberOfPositions section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetNumberOfPositions' })).toBeInTheDocument()
	})

	it('reads the count and each label by index', () => {
		renderSubject()

		expect(screen.getByRole('group', { name: 'Positions' })).toHaveTextContent('3')
		expect(screen.getByRole('group', { name: '0' })).toHaveTextContent('Low')
		expect(screen.getByRole('group', { name: '1' })).toHaveTextContent('Medium')
		expect(screen.getByRole('group', { name: '2' })).toHaveTextContent('High')
	})

	it('reads the count alone when the switch has no labels', () => {
		state.positions = [8, []]

		renderSubject()

		expect(screen.getByRole('group', { name: 'Positions' })).toHaveTextContent('8')
		expect(screen.getAllByRole('group')).toHaveLength(1)
	})

	it('reads a dash before the first read', () => {
		state.positions = undefined

		renderSubject()

		expect(screen.getByRole('group', { name: 'Positions' })).toHaveTextContent('-')
	})

	it('reads once, without polling', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getNumberOfPositions')
	})

	it("shows a failing read in the section's error indicator", async () => {
		state.error = new Error('switch unreachable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetNumberOfPositions: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/switch unreachable/iu)).toBeInTheDocument()
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

describe('Switch GetNumberOfPositions widget in a 320 px pane', () => {
	beforeEach(() => {
		state.positions = [3, ['Low', 'Medium', 'High']]
		state.error = null
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
