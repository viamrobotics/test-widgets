import { fireEvent, render, screen, within } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../IsPoweredWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const queryState = vi.hoisted((): { data: [boolean, number] | undefined; error: Error | null } => ({
	data: undefined,
	error: null,
}))

vi.mock('@viamrobotics/sdk', () => ({
	MotorClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: queryState.data,
		isLoading: queryState.data === undefined && queryState.error === null,
		isSuccess: queryState.data !== undefined,
		isError: queryState.error !== null,
		error: queryState.error,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-motor' },
	})

describe('Motor IsPowered widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the IsPowered section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'IsPowered' })).toBeInTheDocument()
	})

	it('shows a Powered dot and the power percent to one decimal while powered', () => {
		queryState.data = [true, 0.5]

		renderSubject()

		const row = within(screen.getByRole('group', { name: 'Power' }))
		expect(row.getByRole('img', { name: 'Powered' })).toBeInTheDocument()
		expect(row.getByText('50.0%')).toBeInTheDocument()
	})

	it('shows a Not powered dot and - while not powered', () => {
		queryState.data = [false, 0.5]

		renderSubject()

		const row = within(screen.getByRole('group', { name: 'Power' }))
		expect(row.getByRole('img', { name: 'Not powered' })).toBeInTheDocument()
		expect(row.getByText('-')).toBeInTheDocument()
		expect(row.queryByText(/%/u)).not.toBeInTheDocument()
	})

	it('draws no readout until the first reply', () => {
		renderSubject()

		expect(screen.queryByRole('group', { name: 'Power' })).not.toBeInTheDocument()
	})

	it('polls isPowered every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'isPowered', {
			refetchInterval: 500,
		})
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('power state unavailable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'IsPowered: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/power state unavailable/iu)).toBeInTheDocument()
	})
})

describe('Motor IsPowered widget in a 320 px pane', () => {
	const renderInPane = () => {
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
		return { pane, root }
	}

	beforeEach(() => {
		queryState.error = null
		queryState.data = [true, 0.12345]
	})

	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe('320px')
	})

	it('does not scroll horizontally', () => {
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
