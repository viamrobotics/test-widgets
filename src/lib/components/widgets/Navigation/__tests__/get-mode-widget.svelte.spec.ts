import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-mode-widget.svelte'

const { queryState } = vi.hoisted(() => ({
	queryState: { data: undefined as number | undefined },
}))

vi.mock('@viamrobotics/sdk', () => ({
	NavigationClient: class {},
	navigationApi: { Mode: { UNSPECIFIED: 0, MANUAL: 1, WAYPOINT: 2, EXPLORE: 3 } },
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

describe('Navigation GetMode widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		vi.mocked(createResourceQuery).mockClear()
	})

	it.each([
		[1, 'Manual'],
		[2, 'Waypoint'],
		[3, 'Explore'],
		[0, '-'],
		[undefined, '-'],
	])('shows mode %s as %s', (mode, label) => {
		queryState.data = mode

		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetMode' })).toBeInTheDocument()
		expect(screen.getByText(label)).toBeInTheDocument()
	})

	it('polls getMode every 1000 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getMode', {
			refetchInterval: 1000,
		})
	})
})
