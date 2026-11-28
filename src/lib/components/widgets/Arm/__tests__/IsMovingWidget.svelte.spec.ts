import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../IsMovingWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const { queryState } = vi.hoisted(() => {
	const state: { data: boolean | undefined } = { data: undefined }
	return { queryState: state }
})

vi.mock('@viamrobotics/sdk', () => ({
	ArmClient: class {},
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
		props: { partID: 'test-part', resourceName: 'test-arm' },
	})

describe('Arm IsMoving widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the IsMoving section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'IsMoving' })).toBeInTheDocument()
	})

	it('shows the moving badge while the arm reports motion', () => {
		queryState.data = true

		renderSubject()

		expect(screen.getByText('Moving')).toBeInTheDocument()
	})

	it('shows the idle badge while the arm reports no motion', () => {
		queryState.data = false

		renderSubject()

		expect(screen.getByText('Idle')).toBeInTheDocument()
	})

	it('shows the update hint as a tooltip on the badge, not as section text', async () => {
		queryState.data = false

		renderSubject()

		expect(screen.queryByText('Updates automatically')).not.toBeInTheDocument()
		screen.getByText('Idle').focus()
		expect(await screen.findByText('Updates automatically')).toBeInTheDocument()
	})

	it('polls isMoving every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'isMoving', {
			refetchInterval: 500,
		})
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

describe('Arm IsMoving widget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally', () => {
		queryState.data = true
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
