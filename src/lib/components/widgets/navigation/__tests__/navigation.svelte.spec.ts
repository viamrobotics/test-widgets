import { render, screen, within } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../navigation.svelte'
import Pane from './__fixtures__/in-320-pane.svelte'

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: undefined,
		isLoading: false,
		isError: false,
		error: null,
		refetch: () => Promise.resolve({ data: undefined, error: null }),
	})),
	createResourceMutation: vi.fn(() => ({
		mutate: vi.fn(),
		isPending: false,
		isError: false,
		error: null,
	})),
}))

const METHODS_IN_ORDER = [
	'GetMode',
	'SetMode',
	'AddWaypoint',
	'RemoveWaypoint',
	'GetLocation',
	'GetWaypoints',
	'GetObstacles',
	'GetPaths',
	'GetProperties',
]

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-navigation' } })

const headingNames = () =>
	screen.getAllByRole('heading').map((heading) => heading.textContent?.trim())

describe('Navigation composite', () => {
	it('renders the nine method sections in layer order', () => {
		renderSubject()

		const names = headingNames()
		const positions = METHODS_IN_ORDER.map((method) => names.indexOf(method))
		expect(positions).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
	})

	it('holds SetMode, AddWaypoint and RemoveWaypoint in the Mutators group', () => {
		renderSubject()

		const group = screen.getByRole('group', { name: 'Mutators' })
		const names = within(group)
			.getAllByRole('heading')
			.map((heading) => heading.textContent?.trim())
		expect(names).toEqual(['SetMode', 'AddWaypoint', 'RemoveWaypoint'])
	})

	it('holds the five query sections in the Queries group', () => {
		renderSubject()

		const group = screen.getByRole('group', { name: 'Queries' })
		const names = within(group)
			.getAllByRole('heading')
			.map((heading) => heading.textContent?.trim())
		expect(names).toEqual([
			'GetLocation',
			'GetWaypoints',
			'GetObstacles',
			'GetPaths',
			'GetProperties',
		])
	})

	it('leaves the map and its tabs to the control', () => {
		const { container } = renderSubject()

		expect(screen.queryByRole('tab')).not.toBeInTheDocument()
		expect(container.querySelector('canvas')).toBeNull()
	})

	it('keeps the root and the pane within 320 px', () => {
		const { container } = render(Pane, { props: { widget: Subject } })

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? container
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
