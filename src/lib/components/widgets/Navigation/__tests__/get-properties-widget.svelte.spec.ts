import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-properties-widget.svelte'
import Pane from './__fixtures__/in-320-pane.svelte'

const { queryState } = vi.hoisted(() => ({
	queryState: {
		data: undefined as { mapType: number } | undefined,
		isError: false,
		error: null as Error | null,
	},
}))

vi.mock('@viamrobotics/sdk', () => ({
	NavigationClient: class {},
	navigationApi: { MapType: { UNSPECIFIED: 0, NONE: 1, GPS: 2 } },
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: queryState.data,
		isLoading: false,
		isError: queryState.isError,
		error: queryState.error,
	})),
}))

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-nav' } })

describe('Navigation GetProperties widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.isError = false
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetProperties heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetProperties' })).toBeInTheDocument()
	})

	it.each([
		[2, 'GPS'],
		[1, 'None'],
		[0, '-'],
	])('reads map type %i as %s in the Map type group', (mapType, text) => {
		queryState.data = { mapType }

		renderSubject()

		expect(screen.getByRole('group', { name: 'Map type' })).toHaveTextContent(text)
	})

	it('reads - before the properties arrive', () => {
		renderSubject()

		expect(screen.getByRole('group', { name: 'Map type' })).toHaveTextContent('-')
	})

	it('reads once, with no polling', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getProperties', {
			refetchInterval: false,
		})
	})

	it('shows the query error in the section indicator', () => {
		queryState.isError = true
		queryState.error = new Error('navigation unreachable')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'GetProperties: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})

describe('Navigation GetProperties widget in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		queryState.data = { mapType: 2 }

		render(Pane, { props: { widget: Subject } })

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? pane
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
