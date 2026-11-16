import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-position-widget.svelte'

const queryState = vi.hoisted(
	(): {
		positions: number[] | undefined
		lengths: number[] | undefined
		error: Error | null
	} => ({
		positions: undefined,
		lengths: undefined,
		error: null,
	})
)

vi.mock('@viamrobotics/sdk', () => ({
	GantryClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: string) => {
		const data = method === 'getPosition' ? queryState.positions : queryState.lengths
		return {
			data,
			isLoading: data === undefined && queryState.error === null,
			isSuccess: data !== undefined,
			isError: queryState.error !== null,
			error: method === 'getPosition' ? queryState.error : null,
		}
	}),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-gantry' },
	})

describe('Gantry GetPosition widget', () => {
	beforeEach(() => {
		queryState.positions = undefined
		queryState.lengths = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetPosition section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetPosition' })).toBeInTheDocument()
	})

	it('renders the axis positions rounded to two decimals', () => {
		queryState.positions = [12.3456, 67.891]
		queryState.lengths = [100.5, 200.25]

		renderSubject()

		expect(screen.getByRole('row', { name: /^0 12\.35 / })).toBeInTheDocument()
		expect(screen.getByRole('row', { name: /^1 67\.89 / })).toBeInTheDocument()
	})

	it('renders the axis lengths rounded to two decimals', () => {
		queryState.positions = [12.3456, 67.891]
		queryState.lengths = [100.5, 200.25]

		renderSubject()

		expect(screen.getByRole('row', { name: / 100\.50$/ })).toBeInTheDocument()
		expect(screen.getByRole('row', { name: / 200\.25$/ })).toBeInTheDocument()
	})

	it('polls getPosition every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getPosition', {
			refetchInterval: 500,
		})
	})

	it('polls getLengths every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getLengths', {
			refetchInterval: 500,
		})
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('gantry position unavailable')

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/gantry position unavailable/iu)).toBeInTheDocument()
	})
})
