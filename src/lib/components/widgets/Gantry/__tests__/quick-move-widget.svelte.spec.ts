import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import Subject from '../quick-move-widget.svelte'
import InPane from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted(
	(): {
		data: Record<string, unknown>
		calls: [string, unknown[]][]
		isCallHeld: boolean
		error: Error | null
	} => ({ data: {}, calls: [], isCallHeld: false, error: null })
)

vi.mock('@viamrobotics/sdk', () => ({
	GantryClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: string) => ({
		get data() {
			return state.data[method]
		},
		isLoading: false,
		isSuccess: true,
		isError: false,
		error: null,
	})),
	createResourceMutation: vi.fn((_client: unknown, method: string) => ({
		mutate: (args: unknown[]) => {
			state.calls.push([method, args])
		},
		mutateAsync: (args: unknown[]) => {
			state.calls.push([method, args])
			return state.isCallHeld ? new Promise(() => {}) : Promise.resolve()
		},
		isPending: false,
		get error() {
			return state.error
		},
	})),
}))

const renderSubject = (extra: { axisNames?: string[]; defaultSpeedsMmPerSec?: number[] } = {}) =>
	render(InWidgetsProvider, {
		props: {
			component: Subject,
			props: { partID: 'test-part', resourceName: 'test-gantry', ...extra },
		},
	})

describe('Gantry QuickMove control', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
		state.data = { getPosition: [11, 22], getLengths: [1000, 600] }
		state.calls = []
		state.isCallHeld = false
		state.error = null
	})

	it('renders a jog row for each axis from the current positions', () => {
		renderSubject()

		expect(screen.getByRole('group', { name: 'Axis 0' })).toHaveTextContent('−10 mm 11.00mm +10 mm')
		expect(screen.getByRole('group', { name: 'Axis 1' })).toHaveTextContent('−10 mm 22.00mm +10 mm')
	})

	it('sends one MoveToPosition with the second axis moved up ten and every axis at 50 mm/s', async () => {
		renderSubject()

		await user.click(screen.getByRole('button', { name: '+10 mm, Axis 1' }))

		expect(state.calls).toEqual([
			[
				'moveToPosition',
				[
					[11, 32],
					[50, 50],
				],
			],
		])
	})

	it('sends one MoveToPosition with the first axis moved down to 1', async () => {
		renderSubject()

		await user.click(screen.getByRole('button', { name: '−10 mm, Axis 0' }))

		expect(state.calls).toEqual([
			[
				'moveToPosition',
				[
					[1, 22],
					[50, 50],
				],
			],
		])
	})

	it('steps by the picked Step', async () => {
		renderSubject()
		await user.click(screen.getByRole('combobox', { name: 'Step' }))
		await user.click(await screen.findByRole('option', { name: '50 mm' }))

		await user.click(screen.getByRole('button', { name: '+50 mm, Axis 1' }))

		expect(state.calls).toEqual([
			[
				'moveToPosition',
				[
					[11, 72],
					[50, 50],
				],
			],
		])
	})

	it('sends every axis at the typed Speed', async () => {
		renderSubject()
		const speed = screen.getByRole('spinbutton', { name: 'Speed' })
		await user.clear(speed)
		await user.type(speed, '20')

		await user.click(screen.getByRole('button', { name: '+10 mm, Axis 0' }))

		expect(state.calls).toEqual([
			[
				'moveToPosition',
				[
					[21, 22],
					[20, 20],
				],
			],
		])
	})

	it('sends nothing while the Speed field is empty', async () => {
		renderSubject()
		await user.clear(screen.getByRole('spinbutton', { name: 'Speed' }))

		await user.click(screen.getByRole('button', { name: '+10 mm, Axis 0' }))

		expect(state.calls).toEqual([])
	})

	it('names the step in flight on the status line', async () => {
		state.isCallHeld = true
		renderSubject()

		await user.click(screen.getByRole('button', { name: '+10 mm, Axis 1' }))

		expect(screen.getByTestId('status-line')).toHaveTextContent('Moving Axis 1 to 32.00 mm')
	})

	it('ignores an axisNames list of the wrong length', () => {
		renderSubject({ axisNames: ['x'] })

		expect(screen.getByRole('group', { name: 'Axis 0' })).toBeInTheDocument()
		expect(screen.getByRole('group', { name: 'Axis 1' })).toBeInTheDocument()
	})

	it('ignores axisNames until GetLengths has answered', () => {
		state.data = { getPosition: [11, 22] }

		renderSubject({ axisNames: ['x', 'y'] })

		expect(screen.getByRole('group', { name: 'Axis 0' })).toBeInTheDocument()
	})

	it('names the rows from axisNames of the same length as the lengths', () => {
		renderSubject({ axisNames: ['x', 'y'] })

		expect(screen.getByRole('group', { name: 'x' })).toHaveTextContent('−10 mm 11.00mm +10 mm')
		expect(screen.getByRole('button', { name: '+10 mm, y' })).toBeInTheDocument()
		expect(screen.queryByRole('group', { name: 'Axis 0' })).toBeNull()
	})

	it('names the axis in the status line from axisNames', async () => {
		state.isCallHeld = true
		renderSubject({ axisNames: ['x', 'y'] })

		await user.click(screen.getByRole('button', { name: '+10 mm, y' }))

		expect(screen.getByTestId('status-line')).toHaveTextContent('Moving y to 32.00 mm')
	})

	it('seeds Speed from the smallest valid default and sends it', async () => {
		renderSubject({ defaultSpeedsMmPerSec: [80, Number.NaN, 0, -5, 30, 60] })

		await user.click(screen.getByRole('button', { name: '+10 mm, Axis 0' }))

		expect(screen.getByRole('spinbutton', { name: 'Speed' })).toHaveValue(30)
		expect(state.calls).toEqual([
			[
				'moveToPosition',
				[
					[21, 22],
					[30, 30],
				],
			],
		])
	})

	it.each([
		{ name: 'empty', speeds: [] },
		{ name: 'all invalid', speeds: [0, -1, Number.POSITIVE_INFINITY] },
	])('keeps Speed at 50 when the default speeds are $name', ({ speeds }) => {
		renderSubject({ defaultSpeedsMmPerSec: speeds })

		expect(screen.getByRole('spinbutton', { name: 'Speed' })).toHaveValue(50)
	})

	it('holds the typed Speed over the seed', async () => {
		renderSubject({ defaultSpeedsMmPerSec: [30] })
		const speed = screen.getByRole('spinbutton', { name: 'Speed' })
		await user.clear(speed)
		await user.type(speed, '20')

		await user.click(screen.getByRole('button', { name: '+10 mm, Axis 0' }))

		expect(state.calls).toEqual([
			[
				'moveToPosition',
				[
					[21, 22],
					[20, 20],
				],
			],
		])
	})

	it('leaves the status line empty while idle', () => {
		renderSubject()

		expect(screen.getByTestId('status-line').textContent).toBe('')
	})

	it('renders the Quick move section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Quick move' })).toBeInTheDocument()
	})

	it("shows the move error in the section's error indicator", () => {
		state.error = new Error('gantry refused to move')

		renderSubject()

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})
})

describe('Gantry QuickMove control in a 320 px pane', () => {
	beforeEach(() => {
		state.data = { getPosition: [412.5, 86, 1234.56], getLengths: [1000, 600, 1500] }
		state.error = null
	})

	it('loads the app stylesheet, so the pane takes its utility width', () => {
		render(InPane, { props: { widget: Subject } })

		expect(getComputedStyle(screen.getByTestId('pane')).width).toBe('320px')
	})

	it('does not scroll horizontally', () => {
		render(InPane, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(screen.getAllByRole('button', { name: /^[−+]10 mm, Axis \d$/u })).toHaveLength(6)
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
