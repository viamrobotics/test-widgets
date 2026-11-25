import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../IsMovingWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

vi.mock('@viamrobotics/sdk', () => ({
	BaseClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: undefined,
		isLoading: true,
		isError: false,
		error: null,
	})),
}))

const mockIsMoving = (isMoving: boolean) => {
	vi.mocked(createResourceQuery).mockReturnValue({
		data: isMoving,
		isLoading: false,
		isSuccess: true,
		isError: false,
		error: null,
	} as never)
}

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-base' },
	})

describe('Base IsMoving widget', () => {
	it('renders the IsMoving section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'IsMoving' })).toBeInTheDocument()
	})

	it('shows the moving badge while the base reports motion', () => {
		mockIsMoving(true)

		renderSubject()

		expect(screen.getByText('Moving')).toBeInTheDocument()
	})

	it('shows the update hint as a tooltip on the badge, not as section text', async () => {
		mockIsMoving(false)

		renderSubject()

		expect(screen.queryByText('Updates automatically')).not.toBeInTheDocument()
		screen.getByText('Idle').focus()
		expect(await screen.findByText('Updates automatically')).toBeInTheDocument()
	})

	it('shows the idle badge while the base reports no motion', () => {
		mockIsMoving(false)

		renderSubject()

		expect(screen.getByText('Idle')).toBeInTheDocument()
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

describe('Base IsMoving widget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally', () => {
		mockIsMoving(true)
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
