import { render, screen, within } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../GetPropertiesWidget.svelte'
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

const rowText = (label: string) =>
	within(screen.getByRole('group', { name: 'Properties' })).getByText(label).parentElement
		?.textContent

describe('Arm GetProperties widget', () => {
	it('draws the method heading', () => {
		mockQuery({ data: { supportManualMode: true, supportCartesianCommands: true } })
		renderWidget()

		expect(screen.getByRole('heading', { name: 'GetProperties' })).toBeInTheDocument()
	})

	it('draws each support flag as Yes or No', () => {
		mockQuery({ data: { supportManualMode: true, supportCartesianCommands: false } })
		renderWidget()

		expect(rowText('Manual mode')).toContain('Yes')
		expect(rowText('Cartesian commands')).toContain('No')
		expect(screen.queryByRole('checkbox')).toBeNull()
	})

	it('names each row value by its label', () => {
		mockQuery({ data: { supportManualMode: true, supportCartesianCommands: false } })
		renderWidget()

		expect(screen.getByRole('group', { name: 'Manual mode' }).textContent).toMatch(/Yes/u)
		expect(screen.getByRole('group', { name: 'Cartesian commands' }).textContent).toMatch(/No/u)
	})

	it('reads - when the query returns no properties', () => {
		mockQuery({})
		renderWidget()

		expect(rowText('Manual mode')).toContain('-')
		expect(rowText('Cartesian commands')).toContain('-')
	})

	it('reads the properties once, with no polling', () => {
		mockQuery({ data: { supportManualMode: false, supportCartesianCommands: false } })
		renderWidget()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getProperties', {
			refetchInterval: false,
		})
	})

	it('shows the query error in the section indicator', () => {
		mockQuery({ isError: true, error: new Error('arm unreachable') })
		renderWidget()

		expect(
			screen.getByRole('button', { name: 'GetProperties: 1 error, copy to clipboard' })
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

describe('Arm GetProperties widget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe('320px')
	})

	it('does not scroll horizontally', () => {
		mockQuery({ data: { supportManualMode: true, supportCartesianCommands: true } })
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
