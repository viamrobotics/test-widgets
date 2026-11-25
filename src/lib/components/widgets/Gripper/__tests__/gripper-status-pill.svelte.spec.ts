import { render, screen, within } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../gripper-status-pill.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted(
	(): {
		data: Record<string, boolean | undefined>
		error: Error | null
		methods: string[]
	} => ({ data: {}, error: null, methods: [] })
)

vi.mock('@viamrobotics/sdk', () => ({
	GripperClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: string) => {
		state.methods.push(method)
		return {
			data: state.data[method],
			isLoading: false,
			isSuccess: true,
			isError: state.error !== null,
			fetchStatus: 'idle',
			error: state.error,
		}
	}),
}))

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-gripper' } })

const pill = () => within(screen.getByRole('group', { name: 'Gripper status' }))

describe('Gripper Status', () => {
	beforeEach(() => {
		state.data = {}
		state.error = null
		state.methods = []
	})

	it('draws the Status heading and polls IsMoving and IsHoldingSomething', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Status' })).toBeInTheDocument()
		expect(state.methods).toEqual(['isMoving', 'isHoldingSomething'])
	})

	it('reads a dash on both sides before the first reads land', () => {
		renderSubject()

		expect(pill().getAllByText('-')).toHaveLength(2)
	})

	it('reads Idle and Empty when nothing moves or is held', () => {
		state.data = { isMoving: false, isHoldingSomething: false }
		renderSubject()

		expect(pill().getByText('Idle')).toHaveClass('badge-neutral')
		expect(pill().getByText('Empty')).toHaveClass('badge-neutral')
	})

	it('reads Moving and Holding when both are true', () => {
		state.data = { isMoving: true, isHoldingSomething: true }
		renderSubject()

		expect(pill().getByText('Moving')).toHaveClass('badge-success')
		expect(pill().getByText('Holding')).toHaveClass('badge-success')
	})

	it('takes one keyboard focus stop for both sides', () => {
		renderSubject()

		expect(screen.getByRole('group', { name: 'Gripper status' })).toHaveAttribute('tabindex', '0')
	})

	it("shows a failed read in the section's error indicator", () => {
		state.error = new Error('gripper unreachable')
		renderSubject()

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})
})

const PANE_WIDTH = '320px'

describe('Gripper Status in a 320 px pane', () => {
	it('loads the app stylesheet, and the pane does not scroll horizontally', () => {
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
