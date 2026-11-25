import { render, screen, within } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetPropertiesWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

interface Properties {
	widthMeters: number
	turningRadiusMeters: number
	wheelCircumferenceMeters: number
}

const state = vi.hoisted(
	(): {
		data: Properties | undefined
		error: Error | null
		calls: { method: string; options: unknown }[]
	} => ({
		data: undefined,
		error: null,
		calls: [],
	})
)

vi.mock('@viamrobotics/sdk', () => ({
	BaseClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: unknown, options: unknown) => {
		state.calls.push({ method: String(method), options })
		return {
			get data() {
				return state.data
			},
			isLoading: false,
			get error() {
				return state.error
			},
		}
	}),
}))

const LOADED: Properties = {
	widthMeters: 0.4,
	turningRadiusMeters: 1.25,
	wheelCircumferenceMeters: 0.31,
}

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-base' },
	})

describe('Base GetProperties widget', () => {
	beforeEach(() => {
		state.data = LOADED
		state.error = null
		state.calls = []
	})

	it('renders the GetProperties section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetProperties' })).toBeInTheDocument()
	})

	it('shows width, turning radius, and wheel circumference with the m suffix', () => {
		renderSubject()

		expect(screen.getByText('Width')).toBeInTheDocument()
		expect(screen.getByText('Turning radius')).toBeInTheDocument()
		expect(screen.getByText('Wheel circumference')).toBeInTheDocument()
		expect(screen.getByText('0.40')).toBeInTheDocument()
		expect(screen.getByText('1.25')).toBeInTheDocument()
		expect(screen.getByText('0.31')).toBeInTheDocument()
		expect(screen.getAllByText('m')).toHaveLength(3)
	})

	it('names each readout by its visible label', () => {
		renderSubject()

		const width = within(screen.getByRole('group', { name: 'Width' }))
		expect(width.getByText('0.40')).toBeInTheDocument()
		const radius = within(screen.getByRole('group', { name: 'Turning radius' }))
		expect(radius.getByText('1.25')).toBeInTheDocument()
		const circumference = within(screen.getByRole('group', { name: 'Wheel circumference' }))
		expect(circumference.getByText('0.31')).toBeInTheDocument()
	})

	it('shows a dash for each value before the properties arrive', () => {
		state.data = undefined

		renderSubject()

		expect(screen.getAllByText('-')).toHaveLength(3)
		expect(screen.queryByText('m')).not.toBeInTheDocument()
	})

	it('reads getProperties once, without polling', () => {
		renderSubject()

		expect(state.calls.filter(({ method }) => method === 'getProperties')).toEqual([
			{ method: 'getProperties', options: { refetchInterval: false } },
		])
	})

	it("shows the query error in the section's error indicator", () => {
		state.error = new Error('properties unavailable')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'GetProperties: 1 error, copy to clipboard' })
		).toBeInTheDocument()
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

describe('Base GetProperties widget in a 320 px pane', () => {
	beforeEach(() => {
		state.data = LOADED
		state.error = null
		state.calls = []
	})

	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally', () => {
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
