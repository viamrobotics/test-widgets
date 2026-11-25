import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-accuracy-widget.svelte'
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
		isLoading: queryState.data === undefined && queryState.error === null,
		isError: queryState.error !== null,
		error: queryState.error,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-movement-sensor' },
	})

describe('MovementSensor GetAccuracy widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetAccuracy section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetAccuracy' })).toBeInTheDocument()
	})

	it('renders the fix quality label from the position fix', () => {
		queryState.data = {
			positionNmeaGgaFix: 4,
			positionHdop: 1.234,
			positionVdop: 4.567,
			accuracy: {},
		}

		renderSubject()

		expect(screen.getByText('RTK')).toBeInTheDocument()
	})

	it('renders HDOP rounded to two decimals', () => {
		queryState.data = {
			positionNmeaGgaFix: 4,
			positionHdop: 1.234,
			positionVdop: 4.567,
			accuracy: {},
		}

		renderSubject()

		expect(screen.getByText('1.23')).toBeInTheDocument()
	})

	it('renders VDOP rounded to two decimals', () => {
		queryState.data = {
			positionNmeaGgaFix: 4,
			positionHdop: 1.234,
			positionVdop: 4.567,
			accuracy: {},
		}

		renderSubject()

		expect(screen.getByText('4.57')).toBeInTheDocument()
	})

	it('reads compass error as degrees', () => {
		queryState.data = { positionNmeaGgaFix: 4, compassDegreesError: 2.5, accuracy: {} }

		renderSubject()

		expect(screen.getByRole('group', { name: 'Compass error' })).toHaveTextContent('2.50 °')
	})

	it('reads a dash for a missing value', () => {
		queryState.data = { positionNmeaGgaFix: 4, accuracy: {} }

		renderSubject()

		expect(screen.getByRole('group', { name: 'HDOP' })).toHaveTextContent('-')
	})

	it('renders one readout per accuracy map key', () => {
		queryState.data = { positionNmeaGgaFix: 4, accuracy: { east: 1.5 } }

		renderSubject()

		expect(screen.getByRole('group', { name: 'east' })).toHaveTextContent('1.50')
	})

	it('offers one fix quality info button for a fix with a hint', () => {
		queryState.data = { positionNmeaGgaFix: 1, accuracy: {} }

		renderSubject()

		expect(screen.getAllByRole('button', { name: 'About fix quality' })).toHaveLength(1)
	})

	it('offers no info button for an invalid fix', () => {
		queryState.data = { positionNmeaGgaFix: 0, accuracy: {} }

		renderSubject()

		expect(screen.queryByRole('button', { name: 'About fix quality' })).not.toBeInTheDocument()
	})

	it('polls getAccuracy every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getAccuracy', {
			refetchInterval: 500,
		})
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('accuracy unavailable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetAccuracy: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/accuracy unavailable/iu)).toBeInTheDocument()
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

describe('MovementSensor GetAccuracy widget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally', () => {
		queryState.data = {
			positionNmeaGgaFix: 5,
			positionHdop: 1.234,
			positionVdop: 4.567,
			compassDegreesError: 2.5,
			accuracy: { a_long_accuracy_key_name: 1.5 },
		}
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
