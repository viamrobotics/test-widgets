import '../../../../../app.css'

import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../power-sensor.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const { queryState } = vi.hoisted(() => {
	const state: { readings: unknown } = { readings: undefined }
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
				getReadings: queryState.readings,
			}[method]
			return {
				data,
				isLoading: false,
				isSuccess: true,
				isError: false,
				error: null,
				refetch: vi.fn(),
			}
		}),
	}
})

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-power-sensor' },
	})

describe('PowerSensor composite', () => {
	beforeEach(() => {
		queryState.readings = { voltage: 12.5 }
	})

	it('orders voltage, current, then power', () => {
		renderSubject()

		const names = screen
			.getAllByRole('heading')
			.map((heading) => heading.textContent)
			.filter((text) => ['GetVoltage', 'GetCurrent', 'GetPower'].includes(text ?? ''))
		expect(names).toEqual(['GetVoltage', 'GetCurrent', 'GetPower'])
	})

	it('hides the readings until Show readings is checked', async () => {
		renderSubject()

		expect(screen.queryByRole('term')).not.toBeInTheDocument()

		await fireEvent.click(screen.getByRole('checkbox', { name: 'Show readings' }))

		expect(screen.getByRole('term')).toHaveTextContent('voltage')
	})

	it('hides the readings again when Show readings is unchecked', async () => {
		renderSubject()
		const checkbox = screen.getByRole('checkbox', { name: 'Show readings' })

		await fireEvent.click(checkbox)
		await fireEvent.click(checkbox)

		expect(screen.queryByRole('term')).not.toBeInTheDocument()
	})

	it('offers Copy JSON beside the GetReadings heading while there is data', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument()
	})
})

describe('PowerSensor composite in a 320 px pane', () => {
	it('does not scroll horizontally', async () => {
		render(PaneSubject, { props: { widget: Subject } })
		await fireEvent.click(screen.getByRole('checkbox', { name: 'Show readings' }))
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
