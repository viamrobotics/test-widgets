import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetVoltageWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const { queryState } = vi.hoisted(() => {
	const state: { data: unknown; error: Error | null } = {
		data: undefined,
		error: null,
	}
	return { queryState: state }
})

vi.mock('@viamrobotics/sdk', () => ({
	PowerSensorClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: queryState.data,
		isLoading: queryState.data === undefined && queryState.error === null,
		isError: queryState.error !== null,
		error: queryState.error,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-power-sensor' },
	})

describe('PowerSensor GetVoltage widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
		localStorage.clear()
	})

	it('renders the GetVoltage section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetVoltage' })).toBeInTheDocument()
	})

	it('renders the voltage rounded to four decimals', () => {
		queryState.data = [12.34567, true]

		renderSubject()

		expect(screen.getByText('12.3457')).toBeInTheDocument()
	})

	it('renders the voltage unit', () => {
		queryState.data = [12.34567, true]

		renderSubject()

		expect(screen.getByText('V')).toBeInTheDocument()
	})

	it('labels an AC reading', () => {
		queryState.data = [12.34567, true]

		renderSubject()

		expect(screen.getByText('AC')).toBeInTheDocument()
	})

	it('labels a DC reading', () => {
		queryState.data = [12.34567, false]

		renderSubject()

		expect(screen.getByText('DC')).toBeInTheDocument()
	})
	it('reads a dash while the query has failed and no value arrived', () => {
		queryState.error = new Error('unavailable')

		renderSubject()

		expect(screen.getByRole('group', { name: 'Voltage' })).toHaveTextContent('- V')
	})

	it('polls getVoltage every second until Pause is pressed', async () => {
		queryState.data = [12.5, false]
		renderSubject()
		const options = (vi
			.mocked(createResourceQuery)
			.mock.calls.find(([, method]) => String(method) === 'getVoltage') ?? [])[2]
		if (typeof options !== 'function') throw new Error('getVoltage takes its options as a function')

		expect(options()).toEqual({ refetchInterval: 1000 })
		expect(screen.getByText('Updates')).toBeInTheDocument()

		await userEvent.click(screen.getByRole('button', { name: 'Pause' }))

		expect(options()).toEqual({ refetchInterval: false })
		expect(screen.getByText('Paused')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('voltage unavailable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetVoltage: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/voltage unavailable/iu)).toBeInTheDocument()
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

describe('PowerSensor GetVoltage widget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally', () => {
		queryState.data = [12.3457, true]
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
