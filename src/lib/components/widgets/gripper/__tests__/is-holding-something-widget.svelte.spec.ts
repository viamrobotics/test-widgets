import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../is-holding-something-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const { queryState } = vi.hoisted(() => {
	const state: { data: boolean | undefined } = { data: undefined }
	return { queryState: state }
})

vi.mock('@viamrobotics/sdk', () => ({
	GripperClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: queryState.data,
		isLoading: false,
		isError: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-gripper' },
	})

describe('Gripper IsHoldingSomething', () => {
	beforeEach(() => {
		queryState.data = undefined
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the IsHoldingSomething section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'IsHoldingSomething' })).toBeInTheDocument()
	})

	it('reads a neutral dash before the first read', () => {
		renderSubject()

		expect(screen.getByText('-')).toHaveClass('badge-neutral')
	})

	it('renders with "Empty" status when not holding', () => {
		queryState.data = false

		renderSubject()

		expect(screen.getByText('Empty')).toHaveClass('badge-neutral')
	})

	it('renders with "Holding" status when holding something', () => {
		queryState.data = true

		renderSubject()

		expect(screen.getByText('Holding')).toHaveClass('badge-success')
	})

	it('shows the update hint as a tooltip on the badge, not as section text', async () => {
		queryState.data = false

		renderSubject()

		expect(screen.queryByText('Updates automatically')).not.toBeInTheDocument()
		screen.getByText('Empty').focus()
		expect(await screen.findByText('Updates automatically')).toBeInTheDocument()
	})

	it('polls isHoldingSomething every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'isHoldingSomething', {
			refetchInterval: 500,
		})
	})
})

const renderInPane = () => {
	render(PaneSubject, { props: { widget: Subject } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

describe('Gripper IsHoldingSomething in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		const { pane, root } = renderInPane()

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
