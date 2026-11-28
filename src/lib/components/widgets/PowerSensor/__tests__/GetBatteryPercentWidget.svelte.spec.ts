import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetBatteryPercentWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

interface QueryState {
	percent: readonly [number, boolean] | undefined
	percentError: Error | null
	properties: { isBatteryPercentSupported: boolean; isChargingSupported?: boolean } | undefined
	propertiesError: Error | null
	readPercentOptions: () => unknown
}

const { queryState } = vi.hoisted(() => {
	const state: QueryState = {
		percent: undefined,
		percentError: null,
		properties: undefined,
		propertiesError: null,
		readPercentOptions: () => undefined,
	}
	return { queryState: state }
})

vi.mock('@viamrobotics/sdk', () => ({
	PowerSensorClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: string, options?: () => unknown) => {
		const isProperties = method === 'getProperties'
		if (!isProperties && options !== undefined) queryState.readPercentOptions = options
		const data = isProperties ? queryState.properties : queryState.percent
		const error = isProperties ? queryState.propertiesError : queryState.percentError
		// A disabled query is pending without fetching, so it never reads as loading.
		const isEnabled = isProperties || queryState.properties?.isBatteryPercentSupported === true
		return {
			data,
			isLoading: isEnabled && data === undefined && error === null,
			isError: error !== null,
			error,
		}
	}),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-power-sensor' },
	})

const UNSUPPORTED_TEXT = 'This power sensor does not report a battery percent.'

describe('PowerSensor GetBatteryPercent widget', () => {
	beforeEach(() => {
		queryState.percent = undefined
		queryState.percentError = null
		queryState.properties = { isBatteryPercentSupported: true }
		queryState.propertiesError = null
		localStorage.clear()
	})

	it('renders the GetBatteryPercent section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetBatteryPercent' })).toBeInTheDocument()
	})

	it('renders the battery percent rounded to one decimal', () => {
		queryState.percent = [87.25, true]

		renderSubject()

		expect(screen.getByRole('group', { name: 'Battery' })).toHaveTextContent('87.3 %')
	})

	it('reads a dash while the query has failed and no value arrived', () => {
		queryState.percentError = new Error('unavailable')

		renderSubject()

		expect(screen.getByRole('group', { name: 'Battery' })).toHaveTextContent('- %')
	})

	it('shows the charging state when the sensor supports it', () => {
		queryState.percent = [87.25, true]
		queryState.properties = { isBatteryPercentSupported: true, isChargingSupported: true }

		renderSubject()

		expect(screen.getByRole('group', { name: 'Battery' })).toHaveTextContent('87.3 % charging')
	})

	it('reads not charging when the sensor supports it and the battery is not charging', () => {
		queryState.percent = [87.25, false]
		queryState.properties = { isBatteryPercentSupported: true, isChargingSupported: true }

		renderSubject()

		expect(screen.getByRole('group', { name: 'Battery' })).toHaveTextContent('87.3 % not charging')
	})

	it('hides the charging state when the sensor does not support it', () => {
		queryState.percent = [87.25, true]
		queryState.properties = { isBatteryPercentSupported: true, isChargingSupported: false }

		renderSubject()

		expect(screen.getByRole('group', { name: 'Battery' })).toHaveTextContent('87.3 %')
		expect(screen.queryByText(/charging/u)).not.toBeInTheDocument()
	})

	it('polls getBatteryPercent every second until Pause is pressed', async () => {
		queryState.percent = [87.25, true]
		renderSubject()

		expect(queryState.readPercentOptions()).toEqual({ enabled: true, refetchInterval: 1000 })
		expect(screen.getByText('Updates')).toBeInTheDocument()

		await userEvent.click(screen.getByRole('button', { name: 'Pause' }))

		expect(queryState.readPercentOptions()).toEqual({ enabled: true, refetchInterval: false })
		expect(screen.getByText('Paused')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
	})

	it('does not fetch getBatteryPercent when the sensor reports no battery percent', () => {
		queryState.properties = { isBatteryPercentSupported: false }

		renderSubject()

		expect(queryState.readPercentOptions()).toEqual({ enabled: false, refetchInterval: 1000 })
	})

	it('says so and shows no reading when the sensor reports no battery percent', () => {
		queryState.properties = { isBatteryPercentSupported: false }

		renderSubject()

		expect(screen.getByText(UNSUPPORTED_TEXT)).toBeInTheDocument()
		expect(screen.queryByRole('group', { name: 'Battery' })).not.toBeInTheDocument()
	})

	it('reads as unsupported and shows no error when GetProperties fails', () => {
		queryState.properties = undefined
		queryState.propertiesError = new Error('unimplemented')

		renderSubject()

		expect(screen.getByText(UNSUPPORTED_TEXT)).toBeInTheDocument()
		expect(screen.queryByText(/unimplemented/iu)).not.toBeInTheDocument()
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.percentError = new Error('battery unavailable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetBatteryPercent: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/battery unavailable/iu)).toBeInTheDocument()
	})
})

const renderInPane = () => {
	render(PaneSubject, { props: { widget: Subject } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

describe('PowerSensor GetBatteryPercent widget in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		queryState.percent = [87.25, true]
		queryState.properties = { isBatteryPercentSupported: true }
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})

	it('does not scroll horizontally with the longest charging state', () => {
		queryState.percent = [100, false]
		queryState.properties = { isBatteryPercentSupported: true, isChargingSupported: true }
		const { pane, root } = renderInPane()

		expect(screen.getByRole('group', { name: 'Battery' })).toHaveTextContent('100.0 % not charging')
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
