import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../get-joint-positions-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

vi.mock('@viamrobotics/sdk', () => ({
	ArmClient: class {},
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

describe('Arm GetJointPositions widget', () => {
	it('renders the joint positions returned by the query', () => {
		vi.mocked(createResourceQuery).mockReturnValue({
			data: { values: [10, 20, 30] },
			isLoading: false,
			isError: false,
			error: null,
		} as never)

		render(Subject, {
			props: { partID: 'test-part', resourceName: 'test-arm' },
		})

		expect(screen.getByText('GetJointPositions')).toBeInTheDocument()
		expect(screen.getByText('Current Positions')).toBeInTheDocument()
	})

	it('creates a resource query for getJointPositions with polling', () => {
		vi.mocked(createResourceQuery).mockReturnValue({
			data: { values: [] },
			isLoading: false,
			isError: false,
			error: null,
		} as never)

		render(Subject, {
			props: { partID: 'test-part', resourceName: 'test-arm' },
		})

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getJointPositions', {
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

describe('Arm GetJointPositions widget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally', () => {
		vi.mocked(createResourceQuery).mockReturnValue({
			data: { values: [0, 45.2, -87.5, 10, 90, 0] },
			isLoading: false,
			isError: false,
			error: null,
		} as never)
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
