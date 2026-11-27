import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetOrientationWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

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
		localStorage.clear()
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

	it('puts degrees on theta alone', () => {
		queryState.data = { oX: 1, oY: 2, oZ: 3, theta: 4 }

		renderSubject()

		expect(screen.getByRole('group', { name: 'θ' })).toHaveTextContent('4.00 °')
		expect(screen.getByRole('group', { name: 'OX' })).not.toHaveTextContent('°')
	})

	it('polls getOrientation every second until Pause is pressed', async () => {
		queryState.data = { oX: 1.111, oY: 2.222, oZ: 3.333, theta: 45.678 }
		renderSubject()
		const options = (vi
			.mocked(createResourceQuery)
			.mock.calls.find(([, method]) => String(method) === 'getOrientation') ?? [])[2]
		if (typeof options !== 'function')
			throw new Error('getOrientation takes its options as a function')

		expect(options()).toEqual({ refetchInterval: 1000 })
		expect(screen.getByText('Updates')).toBeInTheDocument()

		await userEvent.click(screen.getByRole('button', { name: 'Pause' }))

		expect(options()).toEqual({ refetchInterval: false })
		expect(screen.getByText('Paused')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('orientation unavailable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetOrientation: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/orientation unavailable/iu)).toBeInTheDocument()
	})
})

const PANE_WIDTH = '320px'

const renderInPane = () => {
	render(PaneSubject, { props: { widget: Subject } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

describe('MovementSensor GetOrientation widget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally', () => {
		queryState.data = { oX: -1.111, oY: 2.222, oZ: -3.333, theta: 359.678 }
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
