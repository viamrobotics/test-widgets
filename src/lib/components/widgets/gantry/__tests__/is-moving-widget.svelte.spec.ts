import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../is-moving-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const { queryState } = vi.hoisted(() => {
	const state: { data: boolean | undefined } = { data: undefined }
	return { queryState: state }
})

vi.mock('@viamrobotics/sdk', () => ({
	GantryClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: queryState.data,
		isLoading: queryState.data === undefined,
		isSuccess: queryState.data !== undefined,
		isError: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-gantry' },
	})

describe('Gantry IsMoving widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the IsMoving section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'IsMoving' })).toBeInTheDocument()
	})

	it('shows the moving badge while the gantry reports motion', () => {
		queryState.data = true

		renderSubject()

		expect(screen.getByText('Moving')).toBeInTheDocument()
	})

	it('shows the idle badge while the gantry reports no motion', () => {
		queryState.data = false

		renderSubject()

		expect(screen.getByText('Idle')).toBeInTheDocument()
	})

	it('draws the badge alone, with the update hint in a tooltip and not as text', () => {
		queryState.data = false

		renderSubject()

		expect(screen.queryByText('Updates automatically')).not.toBeInTheDocument()
	})

	it('polls isMoving every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'isMoving', {
			refetchInterval: 500,
		})
	})
})

describe('Gantry IsMoving widget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		render(PaneSubject, { props: { widget: Subject } })

		expect(getComputedStyle(screen.getByTestId('pane')).width).toBe('320px')
	})

	it('does not scroll horizontally', () => {
		queryState.data = true
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
