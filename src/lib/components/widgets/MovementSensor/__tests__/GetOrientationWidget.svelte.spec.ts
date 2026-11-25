import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetOrientationWidget.svelte'

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

describe('MovementSensor GetOrientation widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetOrientation section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetOrientation' })).toBeInTheDocument()
	})

	it('renders the x component rounded to two decimals', () => {
		queryState.data = { oX: 1.111, oY: 2.222, oZ: 3.333, theta: 45.678 }

		renderSubject()

		expect(screen.getByText('1.11')).toBeInTheDocument()
	})

	it('renders the y component rounded to two decimals', () => {
		queryState.data = { oX: 1.111, oY: 2.222, oZ: 3.333, theta: 45.678 }

		renderSubject()

		expect(screen.getByText('2.22')).toBeInTheDocument()
	})

	it('renders the z component rounded to two decimals', () => {
		queryState.data = { oX: 1.111, oY: 2.222, oZ: 3.333, theta: 45.678 }

		renderSubject()

		expect(screen.getByText('3.33')).toBeInTheDocument()
	})

	it('renders theta rounded to two decimals', () => {
		queryState.data = { oX: 1.111, oY: 2.222, oZ: 3.333, theta: 45.678 }

		renderSubject()

		expect(screen.getByText('45.68')).toBeInTheDocument()
	})

	it('polls getOrientation every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getOrientation', {
			refetchInterval: 500,
		})
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('orientation unavailable')

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/orientation unavailable/iu)).toBeInTheDocument()
	})
})
