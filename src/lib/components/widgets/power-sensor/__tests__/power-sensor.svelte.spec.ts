import { render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../power-sensor.svelte'

const { queryState } = vi.hoisted(() => {
	const state: { properties: unknown; propertiesError: Error | null } = {
		properties: undefined,
		propertiesError: null,
	}
	return { queryState: state }
})

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => {
			const data = {
				getVoltage: [12.5, true],
				getCurrent: [1.5, false],
				getPower: 18.75,
				getBatteryPercent: [87.25, true],
				getProperties: queryState.properties,
			}[method]
			const error = method === 'getProperties' ? queryState.propertiesError : null
			return {
				data,
				isLoading: false,
				isSuccess: error === null,
				isError: error !== null,
				error,
				refetch: vi.fn(),
			}
		}),
	}
})

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-power-sensor' },
	})

describe('PowerSensor widget battery section', () => {
	beforeEach(() => {
		queryState.properties = undefined
		queryState.propertiesError = null
	})

	it('shows the battery percent to one decimal when the sensor supports it', () => {
		queryState.properties = { isBatteryPercentSupported: true }

		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetBatteryPercent' })).toBeInTheDocument()
		expect(screen.getByText('87.3')).toBeInTheDocument()
	})

	it('shows the charging state when the sensor supports it', () => {
		queryState.properties = { isBatteryPercentSupported: true, isChargingSupported: true }

		renderSubject()

		expect(screen.getByText('(charging)')).toBeInTheDocument()
	})

	it('hides the charging state when the sensor does not support it', () => {
		queryState.properties = { isBatteryPercentSupported: true, isChargingSupported: false }

		renderSubject()

		expect(screen.getByText('87.3')).toBeInTheDocument()
		expect(screen.queryByText(/charging\)/u)).not.toBeInTheDocument()
	})

	it('hides the battery section when the sensor reports no battery percent', () => {
		queryState.properties = { isBatteryPercentSupported: false }

		renderSubject()

		expect(screen.queryByRole('heading', { name: 'GetBatteryPercent' })).not.toBeInTheDocument()
	})

	it('hides the battery section and shows no error when GetProperties fails', () => {
		queryState.propertiesError = new Error('unimplemented')

		renderSubject()

		expect(screen.queryByRole('heading', { name: 'GetBatteryPercent' })).not.toBeInTheDocument()
		expect(screen.queryByText(/unimplemented/iu)).not.toBeInTheDocument()
	})
})
