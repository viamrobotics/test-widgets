import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../move-to-joint-positions-widget.svelte'
import InPane from './__fixtures__/in-320-pane.svelte'

const queryDataByMethod = vi.hoisted(() => new Map<string, unknown>())

vi.mock('@viamrobotics/sdk', () => ({
	ArmClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: string) => ({
		data: queryDataByMethod.get(method),
		isLoading: !queryDataByMethod.has(method),
		isSuccess: queryDataByMethod.has(method),
		isError: false,
		error: null,
		refetch: vi.fn(),
	})),
	createResourceMutation: vi.fn(() => ({
		mutate: vi.fn(),
		mutateAsync: vi.fn(),
		isPending: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-arm' },
	})

describe('Arm move-to-joint-positions widget', () => {
	it('renders the MoveToJointPositions section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'MoveToJointPositions' })).toBeInTheDocument()
	})

	it('creates the moveToJointPositions mutation', () => {
		renderSubject()

		expect(createResourceMutation).toHaveBeenCalledWith(expect.anything(), 'moveToJointPositions')
	})
})

const PANE_WIDTH = '320px'
const JOINT_COUNT = 6

describe('Arm move-to-joint-positions widget in a 320 px pane', () => {
	beforeEach(() => {
		queryDataByMethod.set('getJointPositions', { values: [0, 60, -179.9, 10, 90, -0.5] })
		queryDataByMethod.set('getKinematics', {
			kinematic_param_type: 'SVA',
			joints: Array.from({ length: JOINT_COUNT }, () => ({ min: -180, max: 180 })),
		})
		queryDataByMethod.set('isMoving', false)
	})

	afterEach(() => {
		queryDataByMethod.clear()
	})

	const renderInPane = () => {
		render(InPane, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
		return { pane, root }
	}

	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally in Jogging mode', () => {
		const { pane, root } = renderInPane()

		expect(
			screen.getAllByRole('button', { name: /joint \d, plus 5 degrees/iu }),
			'every jog row rendered'
		).toHaveLength(JOINT_COUNT)
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})

	it('does not scroll horizontally in Joint Positions mode', async () => {
		const { pane, root } = renderInPane()

		await userEvent.click(screen.getByRole('radio', { name: 'Joint Positions' }))

		expect(screen.getAllByRole('slider'), 'every joint slider rendered').toHaveLength(JOINT_COUNT)
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
