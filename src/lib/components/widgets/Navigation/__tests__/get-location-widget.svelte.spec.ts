import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-location-widget.svelte'

interface Location {
	location?: { latitude: number; longitude: number }
	compassHeading?: number
}

const { queryState } = vi.hoisted(() => ({
	queryState: { data: undefined as Location | undefined },
}))

vi.mock('@viamrobotics/sdk', () => ({
	NavigationClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: queryState.data,
		isLoading: false,
		isError: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-nav' } })

describe('Navigation GetLocation widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		vi.mocked(createResourceQuery).mockClear()
	})

	it('shows latitude, longitude, and heading with degree suffixes', () => {
		queryState.data = { location: { latitude: 40.5, longitude: -73.25 }, compassHeading: 90 }

		renderSubject()

		expect(screen.getByText('40.5')).toBeInTheDocument()
		expect(screen.getByText('-73.25')).toBeInTheDocument()
		expect(screen.getByText('90')).toBeInTheDocument()
		expect(screen.getAllByText('°')).toHaveLength(3)
	})

	it('shows - for every missing value', () => {
		renderSubject()

		expect(screen.getAllByText('-')).toHaveLength(3)
		expect(screen.queryByText('°')).not.toBeInTheDocument()
	})

	it('polls getLocation every 1000 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getLocation', {
			refetchInterval: 1000,
		})
	})
})
