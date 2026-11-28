import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetAccuracyWidget.svelte'

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

describe('MovementSensor GetAccuracy widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetAccuracy section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetAccuracy' })).toBeInTheDocument()
	})

	it('renders the fix quality label from the position fix', () => {
		queryState.data = { positionNmeaGgaFix: 4, positionHdop: 1.234, positionVdop: 4.567 }

		renderSubject()

		expect(screen.getByText('RTK')).toBeInTheDocument()
	})

	it('renders HDOP rounded to two decimals', () => {
		queryState.data = { positionNmeaGgaFix: 4, positionHdop: 1.234, positionVdop: 4.567 }

		renderSubject()

		expect(screen.getByText('1.23')).toBeInTheDocument()
	})

	it('renders VDOP rounded to two decimals', () => {
		queryState.data = { positionNmeaGgaFix: 4, positionHdop: 1.234, positionVdop: 4.567 }

		renderSubject()

		expect(screen.getByText('4.57')).toBeInTheDocument()
	})

	it('polls getAccuracy every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getAccuracy', {
			refetchInterval: 500,
		})
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('accuracy unavailable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetAccuracy: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/accuracy unavailable/iu)).toBeInTheDocument()
	})
})
