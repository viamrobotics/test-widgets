import type { Pose } from '@viamrobotics/sdk'

import { render, screen } from '@testing-library/svelte'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../MoveToPositionWidget.svelte'
import InPane from './__fixtures__/In320Pane.svelte'

const { served } = vi.hoisted(() => ({
	served: {
		dataByMethod: new Map<string, unknown>(),
		motionServiceNames: new Array<string>(),
	},
}))

vi.mock('@viamrobotics/sdk', () => ({
	ArmClient: class {},
	MotionClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => {
	const queryFor = (_client: unknown, method: string) => {
		const data = served.dataByMethod.get(method)
		return {
			data,
			isLoading: data === undefined,
			isSuccess: data !== undefined,
			isError: false,
			error: null,
		}
	}
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn(queryFor),
		createRobotQuery: vi.fn(queryFor),
		useRobotClient: vi.fn(() => ({ current: {} })),
		useResourceStatuses: vi.fn(() => ({
			current: served.motionServiceNames.map((name) => ({
				name: { name, namespace: 'rdk', type: 'service', subtype: 'motion' },
			})),
		})),
		createResourceMutation: vi.fn(() => ({
			mutate: vi.fn(),
			mutateAsync: vi.fn(),
			isPending: false,
			error: null,
		})),
	}
})

const PANE_WIDTH = '320px'

const widestPose: Pose = {
	x: -1234.56,
	y: -1234.56,
	z: -1234.56,
	oX: -0.7071,
	oY: -0.7071,
	oZ: -0.7071,
	theta: -179.99,
}

const serveEveryControl = () => {
	served.motionServiceNames = ['builtin', 'custom-motion']
	served.dataByMethod.set('frameSystemConfig', [{ frame: { referenceFrame: 'test-arm' } }])
	served.dataByMethod.set('getPose', { pose: widestPose, referenceFrame: 'world' })
	served.dataByMethod.set('getEndPosition', widestPose)
	served.dataByMethod.set('isMoving', false)
}

const renderInPane = () => {
	render(InPane, { props: { widget: Subject } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

describe('Arm MoveToPosition widget', () => {
	beforeEach(() => {
		served.dataByMethod.clear()
		served.motionServiceNames = []
	})

	it('renders the MoveToPosition section heading', () => {
		render(InWidgetsProvider, {
			props: { component: Subject, props: { partID: 'test-part', resourceName: 'test-arm' } },
		})

		expect(screen.getByRole('heading', { name: 'MoveToPosition' })).toBeInTheDocument()
	})
})

describe('Arm MoveToPosition widget in a 320 px pane', () => {
	beforeEach(() => {
		served.dataByMethod.clear()
		serveEveryControl()
	})

	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('draws the mode toggle, the service select, and all seven pose fields', () => {
		renderInPane()

		expect(screen.getAllByRole('radio')).toHaveLength(2)
		expect(screen.getByRole('combobox')).toHaveTextContent('builtin')
		expect(screen.getAllByRole('spinbutton')).toHaveLength(7)
	})

	it('does not scroll horizontally with the widest pose values', () => {
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
