import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-position-widget.svelte'

const { queryState } = vi.hoisted(() => {
	const state: { data: number | undefined; error: Error | null } = {
		data: undefined,
		error: null,
	}
	return { queryState: state }
})

vi.mock('@viamrobotics/sdk', () => ({
	ServoClient: class {},
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
		props: { partID: 'test-part', resourceName: 'test-servo' },
	})

describe('Servo GetPosition widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetPosition section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetPosition' })).toBeInTheDocument()
	})

	it('renders the position rounded to two decimals', () => {
		queryState.data = 90.12_345

		renderSubject()

		expect(screen.getByText('90.12')).toBeInTheDocument()
	})

	it('polls getPosition every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getPosition', {
			refetchInterval: 500,
		})
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('servo position unavailable')

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/servo position unavailable/iu)).toBeInTheDocument()
	})
})
