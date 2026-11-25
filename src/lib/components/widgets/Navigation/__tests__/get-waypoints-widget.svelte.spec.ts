import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-waypoints-widget.svelte'
import { waypoints } from './__fixtures__/waypoints'

const { queryState } = vi.hoisted(() => {
	const state: { data: unknown[] | undefined } = { data: undefined }
	return { queryState: state }
})

vi.mock('@viamrobotics/sdk', () => ({ NavigationClient: class {} }))

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
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-navigation' } })

describe('Navigation GetWaypoints widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetWaypoints section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetWaypoints' })).toBeInTheDocument()
	})

	it('renders one row per waypoint with a 1-based label and its location', () => {
		queryState.data = waypoints

		renderSubject()

		expect(screen.getAllByRole('listitem')).toHaveLength(3)
		expect(screen.getByText('Waypoint 1')).toBeInTheDocument()
		expect(screen.getByText('Waypoint 3')).toBeInTheDocument()
		expect(screen.getByText('1, 2')).toBeInTheDocument()
		expect(screen.getByText('5, 6')).toBeInTheDocument()
	})

	it('reads - when there are no waypoints', () => {
		queryState.data = []

		renderSubject()

		expect(screen.getByText('-')).toBeInTheDocument()
		expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
	})

	it('polls getWayPoints every 1000 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getWayPoints', {
			refetchInterval: 1000,
		})
	})
})
