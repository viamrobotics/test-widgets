import { fireEvent, render, screen, within } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetPositionWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const queryState = vi.hoisted(
	(): {
		positions: number[] | undefined
		lengths: number[] | undefined
		error: Error | null
	} => ({
		positions: undefined,
		lengths: undefined,
		error: null,
	})
)

vi.mock('@viamrobotics/sdk', () => ({
	GantryClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: string) => {
		const data = method === 'getPosition' ? queryState.positions : queryState.lengths
		return {
			data,
			isLoading: data === undefined && queryState.error === null,
			isSuccess: data !== undefined,
			isError: queryState.error !== null,
			error: method === 'getPosition' ? queryState.error : null,
		}
	}),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-gantry' },
	})

describe('Gantry GetPosition widget', () => {
	beforeEach(() => {
		queryState.positions = undefined
		queryState.lengths = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetPosition section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetPosition' })).toBeInTheDocument()
	})

	it('renders one row per axis, numbered from 0, with the position rounded to two decimals and an mm suffix', () => {
		queryState.positions = [12.3456, 67.891]
		queryState.lengths = [100.5, 200.25]

		renderSubject()

		const axes = within(screen.getByRole('group', { name: 'Axis positions' }))
		expect(axes.getByText('Axis 0')).toBeInTheDocument()
		expect(axes.getByText('Axis 1')).toBeInTheDocument()
		expect(axes.queryByText('Axis 2')).not.toBeInTheDocument()
		expect(axes.getByText('12.35')).toBeInTheDocument()
		expect(axes.getByText('67.89')).toBeInTheDocument()
		expect(axes.getAllByText('mm')).toHaveLength(2)
	})

	it('renders each axis length rounded to two decimals under its position', () => {
		queryState.positions = [12.3456, 67.891]
		queryState.lengths = [100.5, 200.25]

		renderSubject()

		expect(screen.getByText('Length 100.50 mm')).toBeInTheDocument()
		expect(screen.getByText('Length 200.25 mm')).toBeInTheDocument()
	})

	it('draws a static track per axis with a length, with the marker at the position over the length', () => {
		queryState.positions = [50, 300]
		queryState.lengths = [200]

		renderSubject()

		const tracks = screen
			.getByRole('group', { name: 'Axis positions' })
			.querySelectorAll('[aria-hidden]')
		expect(tracks).toHaveLength(1)
		expect(tracks[0]?.firstElementChild).toHaveStyle({ left: 'calc(25% - 1px)' })
	})

	it('draws no track and no length for an axis without a length', () => {
		queryState.positions = [50, 300]
		queryState.lengths = [200]

		renderSubject()

		expect(screen.getByText('300.00')).toBeInTheDocument()
		expect(screen.getAllByText(/^Length /u)).toHaveLength(1)
	})

	it('holds the marker inside the track when the position is past the length', () => {
		queryState.positions = [500, -20]
		queryState.lengths = [200, 200]

		renderSubject()

		const markers = screen
			.getByRole('group', { name: 'Axis positions' })
			.querySelectorAll('[aria-hidden] > span')
		expect(markers[0]).toHaveStyle({ left: 'calc(100% - 1px)' })
		expect(markers[1]).toHaveStyle({ left: 'calc(0% - 1px)' })
	})

	it('polls getPosition every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getPosition', {
			refetchInterval: 500,
		})
	})

	it('polls getLengths every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getLengths', {
			refetchInterval: 500,
		})
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('gantry position unavailable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetPosition: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/gantry position unavailable/iu)).toBeInTheDocument()
	})
})

describe('Gantry GetPosition widget in a 320 px pane', () => {
	const renderInPane = () => {
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
		return { pane, root }
	}

	beforeEach(() => {
		queryState.error = null
	})

	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe('320px')
	})

	it('does not scroll horizontally with four-digit positions and lengths', () => {
		queryState.positions = [-1234.56, 8888.88, 1234.56]
		queryState.lengths = [10000, 1500, 99999.99]
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
