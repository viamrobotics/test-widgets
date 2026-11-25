import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetCurrentWidget.svelte'

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

describe('PowerSensor GetCurrent widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetCurrent section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetCurrent' })).toBeInTheDocument()
	})

	it('renders the current rounded to four decimals', () => {
		queryState.data = [1.23456, true]

		renderSubject()

		expect(screen.getByText('1.2346')).toBeInTheDocument()
	})

	it('renders the current unit', () => {
		queryState.data = [1.23456, true]

		renderSubject()

		expect(screen.getByText('A')).toBeInTheDocument()
	})

	it('labels an AC reading', () => {
		queryState.data = [1.23456, true]

		renderSubject()

		expect(screen.getByText('(AC)')).toBeInTheDocument()
	})

	it('labels a DC reading', () => {
		queryState.data = [1.23456, false]

		renderSubject()

		expect(screen.getByText('(DC)')).toBeInTheDocument()
	})
	it('polls getCurrent every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getCurrent', {
			refetchInterval: 500,
		})
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('current unavailable')

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/current unavailable/iu)).toBeInTheDocument()
	})
})
