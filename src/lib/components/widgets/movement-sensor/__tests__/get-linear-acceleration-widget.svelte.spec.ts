import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-linear-acceleration-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

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
		isLoading: false,
		isError: queryState.error !== null,
		error: queryState.error,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-movement-sensor' },
	})

describe('MovementSensor GetLinearAcceleration widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetLinearAcceleration section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetLinearAcceleration' })).toBeInTheDocument()
	})

	it('renders each component rounded to two decimals with the unit', () => {
		queryState.data = { x: 1.111, y: 2.222, z: 3.333 }

		renderSubject()

		expect(screen.getByRole('group', { name: 'X' })).toHaveTextContent('1.11 m/s²')
		expect(screen.getByRole('group', { name: 'Y' })).toHaveTextContent('2.22 m/s²')
		expect(screen.getByRole('group', { name: 'Z' })).toHaveTextContent('3.33 m/s²')
	})

	it('groups the components under the Linear acceleration label', () => {
		queryState.data = { x: 1, y: 2, z: 3 }

		renderSubject()

		const group = screen.getByRole('group', { name: 'Linear acceleration' })
		expect(group).toBeInTheDocument()
		expect(group).toContainElement(screen.getByRole('group', { name: 'X' }))
		expect(screen.getByText('Linear acceleration')).toBeVisible()
		expect(group).toHaveAttribute('aria-labelledby', screen.getByText('Linear acceleration').id)
	})

	it('reads a dash with no unit before data arrives', () => {
		renderSubject()

		const readout = screen.getByRole('group', { name: 'Linear acceleration' })
		expect(readout.textContent?.trim()).toBe('-')
	})

	it('reads a missing component as a dash', () => {
		queryState.data = { x: 1, z: 3 }

		renderSubject()

		expect(screen.getByRole('group', { name: 'Y' }).textContent?.trim()).toBe('-')
	})

	it('polls getLinearAcceleration every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getLinearAcceleration', {
			refetchInterval: 500,
		})
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('reading unavailable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetLinearAcceleration: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/reading unavailable/iu)).toBeInTheDocument()
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

describe('MovementSensor GetLinearAcceleration widget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally', () => {
		queryState.data = { x: -1111.111, y: 2222.222, z: -3333.333 }
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
