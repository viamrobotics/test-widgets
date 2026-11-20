import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-position-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted(
	(): {
		position: number | undefined
		positions: [number, string[]] | undefined
		positionError: Error | null
	} => ({ position: undefined, positions: undefined, positionError: null })
)

vi.mock('@viamrobotics/sdk', () => ({
	SwitchClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: string) => ({
		data: method === 'getPosition' ? state.position : state.positions,
		isLoading: false,
		isError: false,
		get error() {
			return method === 'getPosition' ? state.positionError : null
		},
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-switch' },
	})

describe('Switch GetPosition widget', () => {
	beforeEach(() => {
		state.position = 1
		state.positions = [3, ['Low', 'Medium', 'High']]
		state.positionError = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetPosition section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetPosition' })).toBeInTheDocument()
	})

	it('reads the label with its index beside it', () => {
		renderSubject()

		expect(screen.getByRole('group', { name: 'Position' })).toHaveTextContent('Medium 1')
	})

	it('reads the index alone when the switch has no labels', () => {
		state.position = 2
		state.positions = [3, []]

		renderSubject()

		expect(screen.getByRole('group', { name: 'Position' })).toHaveTextContent('2')
	})

	it('reads a dash before the first read', () => {
		state.position = undefined
		state.positions = undefined

		renderSubject()

		expect(screen.getByRole('group', { name: 'Position' })).toHaveTextContent('-')
	})

	it('polls getPosition every 500 ms and says so', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getPosition', {
			refetchInterval: 500,
		})
		expect(screen.getByText('Updates automatically')).toBeInTheDocument()
	})

	it("shows a failing read in the section's error indicator", async () => {
		state.positionError = new Error('switch unreachable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetPosition: 1 error, copy to clipboard' })
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

describe('Switch GetPosition widget in a 320 px pane', () => {
	beforeEach(() => {
		state.position = 1
		state.positions = [3, ['Low', 'Medium', 'High']]
		state.positionError = null
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
