import { fireEvent, render, screen, within } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-position-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const queryState = vi.hoisted(
	(): {
		positionReporting: boolean | undefined
		position: number | undefined
		error: Error | null
	} => ({
		positionReporting: undefined,
		position: undefined,
		error: null,
	})
)

vi.mock('@viamrobotics/sdk', () => ({
	MotorClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: string) => {
		if (method === 'getProperties') {
			const data =
				queryState.positionReporting === undefined
					? undefined
					: { positionReporting: queryState.positionReporting }
			return {
				data,
				isLoading: data === undefined,
				isSuccess: data !== undefined,
				isError: false,
				error: null,
			}
		}
		return {
			data: queryState.position,
			isLoading: queryState.position === undefined && queryState.error === null,
			isSuccess: queryState.position !== undefined,
			isError: queryState.error !== null,
			error: queryState.error,
		}
	}),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-motor' },
	})

describe('Motor GetPosition widget', () => {
	beforeEach(() => {
		queryState.positionReporting = true
		queryState.position = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetPosition section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetPosition' })).toBeInTheDocument()
	})

	it('shows the position to four decimals with a rev suffix', () => {
		queryState.position = 12.5

		renderSubject()

		const row = within(screen.getByRole('group', { name: 'Position' }))
		expect(row.getByText('12.5000')).toBeInTheDocument()
		expect(row.getByText('rev')).toBeInTheDocument()
	})

	it('draws no readout until the first position reply', () => {
		renderSubject()

		expect(screen.queryByRole('group', { name: 'Position' })).not.toBeInTheDocument()
	})

	it('shows - with no focusable element when the motor does not report position', () => {
		queryState.positionReporting = false
		queryState.position = 12.5

		renderSubject()

		const readout = screen.getByRole('group', { name: 'Position' })
		const group = within(readout)
		expect(group.getByText('-')).toBeInTheDocument()
		expect(group.queryByText('rev')).not.toBeInTheDocument()
		expect(readout.querySelector('[tabindex]')).toBeNull()
		expect(readout.closest('div')?.querySelector('[tabindex]')).toBeNull()
	})

	it('shows why in visible text that describes the Position group', () => {
		queryState.positionReporting = false
		queryState.position = 12.5

		renderSubject()

		expect(screen.getByRole('group', { name: 'Position' })).toHaveAccessibleDescription(
			'This motor does not report its position.'
		)
		expect(screen.getByText('This motor does not report its position.')).toBeVisible()
	})

	it('shows no reason while the motor reports its position', () => {
		renderSubject()

		expect(screen.queryByText('This motor does not report its position.')).not.toBeInTheDocument()
	})

	it('polls getPosition every 500 ms, only once position reporting is known', () => {
		renderSubject()

		const call = vi
			.mocked(createResourceQuery)
			.mock.calls.find(([, method]) => String(method) === 'getPosition')
		const options = call?.[2]
		if (typeof options !== 'function') throw new Error('getPosition options are not reactive')
		expect(options()).toEqual({ enabled: true, refetchInterval: 500 })
	})

	it('does not poll getPosition when the motor does not report position', () => {
		queryState.positionReporting = false

		renderSubject()

		const call = vi
			.mocked(createResourceQuery)
			.mock.calls.find(([, method]) => String(method) === 'getPosition')
		const options = call?.[2]
		if (typeof options !== 'function') throw new Error('getPosition options are not reactive')
		expect(options()).toEqual({ enabled: false, refetchInterval: 500 })
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('motor position unavailable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetPosition: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/motor position unavailable/iu)).toBeInTheDocument()
	})
})

describe('Motor GetPosition widget in a 320 px pane', () => {
	const renderInPane = () => {
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
		return { pane, root }
	}

	beforeEach(() => {
		queryState.error = null
		queryState.positionReporting = true
		queryState.position = -12345.6789
	})

	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe('320px')
	})

	it('does not scroll horizontally with a large position', () => {
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
