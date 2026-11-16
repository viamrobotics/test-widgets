import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-position-widget.svelte'

const { queryState } = vi.hoisted(() => {
	const state: { data: unknown; error: Error | null } = {
		data: undefined,
		error: null,
	}
	return { queryState: state }
})

vi.mock('@viamrobotics/sdk', () => ({
	MovementSensorClient: class {},
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
		props: { partID: 'test-part', resourceName: 'test-movement-sensor' },
	})

describe('MovementSensor GetPosition widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetPosition section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetPosition' })).toBeInTheDocument()
	})

	it('renders the latitude to six decimals', () => {
		queryState.data = {
			coordinate: { latitude: 40.123_456_7, longitude: -73.654_321_9 },
			altitudeM: 12.5,
		}

		renderSubject()

		expect(screen.getByText('40.123457')).toBeInTheDocument()
	})

	it('renders the longitude to six decimals', () => {
		queryState.data = {
			coordinate: { latitude: 40.123_456_7, longitude: -73.654_321_9 },
			altitudeM: 12.5,
		}

		renderSubject()

		expect(screen.getByText('-73.654322')).toBeInTheDocument()
	})

	it('renders the altitude rounded to two decimals', () => {
		queryState.data = {
			coordinate: { latitude: 40.123_456_7, longitude: -73.654_321_9 },
			altitudeM: 12.5,
		}

		renderSubject()

		expect(screen.getByText('12.50')).toBeInTheDocument()
	})

	it('polls getPosition every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getPosition', {
			refetchInterval: 500,
		})
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('position unavailable')

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/position unavailable/iu)).toBeInTheDocument()
	})
})
