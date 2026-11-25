import { render, screen, within } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../get-end-position-widget.svelte'
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

const pose = { x: 312.4, y: 152.5, z: 420, oX: 0, oY: 0, oZ: 1, theta: 90 }

const mockQuery = (overrides: Record<string, unknown>) => {
	vi.mocked(createResourceQuery).mockReturnValue({
		data: undefined,
		isLoading: false,
		isError: false,
		error: null,
		...overrides,
	} as never)
}

const renderWidget = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-arm' } })

describe('Arm GetEndPosition widget', () => {
	it('draws the method heading and the group label', () => {
		mockQuery({ data: pose })
		renderWidget()

		expect(screen.getByRole('heading', { name: 'GetEndPosition' })).toBeInTheDocument()
		expect(screen.getByRole('group', { name: 'Current Position' })).toBeInTheDocument()
	})

	it('draws position in mm and orientation in degrees', () => {
		mockQuery({ data: pose })
		renderWidget()

		const group = within(screen.getByRole('group', { name: 'Current Position' }))
		const rowText = (label: string) => group.getByText(label).parentElement?.textContent
		expect(rowText('X')).toMatch(/312\.40\s*mm/u)
		expect(rowText('Y')).toMatch(/152\.50\s*mm/u)
		expect(rowText('Z')).toMatch(/420\.00\s*mm/u)
		expect(rowText('OX')).toMatch(/0\.00\s*°/u)
		expect(rowText('OZ')).toMatch(/1\.00\s*°/u)
		expect(rowText('Theta')).toMatch(/90\.00\s*°/u)
	})

	it('reads - with no unit when the query returns no pose', () => {
		mockQuery({})
		renderWidget()

		const group = within(screen.getByRole('group', { name: 'Current Position' }))
		expect(group.getAllByText('-')).toHaveLength(7)
		expect(group.queryByText('mm')).toBeNull()
		expect(group.queryByText('°')).toBeNull()
	})

	it('names each row value by its label', () => {
		mockQuery({ data: pose })
		renderWidget()

		const outer = within(screen.getByRole('group', { name: 'Current Position' }))
		expect(outer.getByRole('group', { name: 'X' }).textContent).toMatch(/312\.40\s*mm/u)
		expect(outer.getByRole('group', { name: 'Theta' }).textContent).toMatch(/90\.00\s*°/u)
		expect(outer.getAllByRole('group')).toHaveLength(7)
	})

	it('polls getEndPosition every 500 ms', () => {
		mockQuery({ data: pose })
		renderWidget()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getEndPosition', {
			refetchInterval: 500,
		})
	})

	it('shows the query error in the section indicator', () => {
		mockQuery({ isError: true, error: new Error('arm unreachable') })
		renderWidget()

		expect(
			screen.getByRole('button', { name: 'GetEndPosition: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})

const renderInPane = () => {
	render(PaneSubject, { props: { widget: Subject } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

describe('Arm GetEndPosition widget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe('320px')
	})

	it('does not scroll horizontally', () => {
		mockQuery({ data: { x: -1234.56, y: 152.5, z: 420, oX: -0.5, oY: 0, oZ: 1, theta: -179.99 } })
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
