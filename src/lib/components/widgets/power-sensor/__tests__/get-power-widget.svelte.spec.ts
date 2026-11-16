import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-power-widget.svelte'

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

describe('PowerSensor GetPower widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetPower section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetPower' })).toBeInTheDocument()
	})

	it('renders the power rounded to four decimals', () => {
		queryState.data = 45.67891

		renderSubject()

		expect(screen.getByText('45.6789')).toBeInTheDocument()
	})

	it('renders the power unit', () => {
		queryState.data = 45.67891

		renderSubject()

		expect(screen.getByText('W')).toBeInTheDocument()
	})
	it('polls getPower every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getPower', {
			refetchInterval: 500,
		})
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('power unavailable')

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/power unavailable/iu)).toBeInTheDocument()
	})
})
