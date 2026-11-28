import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetReadingsWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const state = vi.hoisted(
	(): {
		readings: Record<string, unknown> | undefined
		options: (() => { refetchInterval?: number | false }) | undefined
	} => ({
		readings: undefined,
		options: undefined,
	})
)

vi.mock('@viamrobotics/sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/sdk')>()),
	SensorClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client, _method, options) => {
			state.options = options
			return {
				get data() {
					return state.readings
				},
				isLoading: false,
				isSuccess: true,
				isError: false,
				error: null,
				fetchStatus: 'idle',
				refetch: vi.fn(),
				queryKey: [],
			}
		}),
		createResourceMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false, error: null })),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-sensor' } })

beforeEach(() => {
	state.readings = { temperature_c: 21.6, firmware: 'v2.4.1' }
	localStorage.clear()
})

describe('Sensor.GetReadings', () => {
	it('renders each reading as a term and its value', () => {
		renderSubject()

		expect(screen.getByRole('term', { name: 'temperature_c' })).toBeInTheDocument()
		expect(screen.getByText('21.6')).toBeInTheDocument()
		expect(screen.getByRole('term', { name: 'firmware' })).toBeInTheDocument()
	})

	it('draws the refresh row with its rate and Pause', () => {
		renderSubject()

		expect(screen.getByRole('combobox', { name: 'Updates' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
	})

	it('polls at the stored rate and stops polling after Pause', async () => {
		const user = userEvent.setup()
		renderSubject()

		expect(state.options?.().refetchInterval).toBe(1000)

		await user.click(screen.getByRole('button', { name: 'Pause' }))

		expect(state.options?.().refetchInterval).toBe(false)
	})

	it('draws exactly one Copy JSON button when there is data', () => {
		renderSubject()

		expect(screen.getAllByRole('button', { name: 'Copy JSON' })).toHaveLength(1)
	})

	it('draws no Copy JSON button without data', () => {
		state.readings = undefined

		renderSubject()

		expect(screen.queryByRole('button', { name: 'Copy JSON' })).not.toBeInTheDocument()
	})
})

describe('Sensor.GetReadings in a 320 px pane', () => {
	it('fits the widget root and the pane within 320 px', () => {
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
