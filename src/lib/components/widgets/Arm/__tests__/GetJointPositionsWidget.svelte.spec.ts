import { fireEvent, render, screen, within } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../GetJointPositionsWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

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

const rowText = (group: ReturnType<typeof within>, label: string) =>
	group.getByText(label).parentElement?.textContent

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
		const group = within(screen.getByRole('group', { name: 'Current Positions' }))
		expect(rowText(group, 'Joint 0')).toMatch(/10\.00\s*°/u)
		expect(rowText(group, 'Joint 1')).toMatch(/20\.00\s*°/u)
		expect(rowText(group, 'Joint 2')).toMatch(/30\.00\s*°/u)
	})

	it('shows the converted joint positions in radians after the unit toggle', async () => {
		vi.mocked(createResourceQuery).mockReturnValue({
			data: { values: [10, 20, 30] },
			isLoading: false,
			isError: false,
			error: null,
		} as never)

		render(Subject, {
			props: { partID: 'test-part', resourceName: 'test-arm' },
		})
		await fireEvent.click(screen.getByRole('button', { name: 'Switch to Radians' }))

		const group = within(screen.getByRole('group', { name: 'Current Positions' }))
		expect(rowText(group, 'Joint 0')).toMatch(/0\.17\s*rad/u)
		expect(rowText(group, 'Joint 1')).toMatch(/0\.35\s*rad/u)
		expect(rowText(group, 'Joint 2')).toMatch(/0\.52\s*rad/u)
		expect(group.queryByText('°')).toBeNull()
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
