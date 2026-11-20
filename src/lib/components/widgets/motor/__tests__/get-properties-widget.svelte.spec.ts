import { render, screen, within } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-properties-widget.svelte'
import PaneSubject from './motor-pane-width.spec.svelte'

const state = vi.hoisted(
	(): { data: { positionReporting: boolean } | undefined; error: Error | null } => ({
		data: undefined,
		error: null,
	})
)

vi.mock('@viamrobotics/sdk', () => ({
	MotorClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		get data() {
			return state.data
		},
		isLoading: false,
		get error() {
			return state.error
		},
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-motor' },
	})

describe('Motor GetProperties widget', () => {
	beforeEach(() => {
		state.data = { positionReporting: true }
		state.error = null
	})

	it('renders the GetProperties section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetProperties' })).toBeInTheDocument()
	})

	it('shows Yes when the motor reports its position', () => {
		renderSubject()

		expect(screen.getByText('Position reporting')).toBeInTheDocument()
		expect(screen.getByRole('group', { name: 'Position reporting' })).toHaveTextContent('Yes')
	})

	it('names the status dot for the concept, not the value', () => {
		renderSubject()

		const group = within(screen.getByRole('group', { name: 'Position reporting' }))
		expect(group.getByLabelText('Position reporting')).toBeInTheDocument()
		expect(group.queryByLabelText('Yes')).not.toBeInTheDocument()
	})

	it('reads a dash in the group, with no dot, before the properties arrive', () => {
		state.data = undefined

		renderSubject()

		const group = within(screen.getByRole('group', { name: 'Position reporting' }))
		expect(group.getByText('-')).toBeInTheDocument()
		expect(group.queryByLabelText('Position reporting')).not.toBeInTheDocument()
	})

	it('shows No when the motor does not report its position', () => {
		state.data = { positionReporting: false }

		renderSubject()

		expect(screen.getByText('No')).toBeInTheDocument()
	})

	it('shows a dash before the properties arrive', () => {
		state.data = undefined

		renderSubject()

		expect(screen.getByText('-')).toBeInTheDocument()
	})

	it("shows the query error in the section's error indicator", () => {
		state.error = new Error('properties unavailable')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'GetProperties: 1 error, copy to clipboard' })
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

describe('Motor GetProperties widget in a 320 px pane', () => {
	beforeEach(() => {
		state.data = { positionReporting: true }
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
