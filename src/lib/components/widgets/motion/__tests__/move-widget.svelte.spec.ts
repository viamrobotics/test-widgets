import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MotionWidget from '../motion.svelte'
import Subject from '../move-widget.svelte'
import InPane from './__fixtures__/in-320-pane.svelte'

const served = vi.hoisted(() => ({ dataByMethod: new Map<string, unknown>() }))

vi.mock('@viamrobotics/sdk', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@viamrobotics/sdk')>()
	return {
		MachineConnectionEvent: actual.MachineConnectionEvent,
		MotionClient: class {},
		Constraints: class {},
		WorldState: class {},
	}
})

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceMutation: vi.fn(() => ({ error: null, isPending: false, mutate: vi.fn() })),
		useRobotClient: vi.fn(() => ({ current: {} })),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
		createRobotQuery: vi.fn((_client: unknown, method: string) => ({
			data: served.dataByMethod.get(method),
			error: null,
			fetchStatus: 'idle',
			isLoading: false,
			isSuccess: served.dataByMethod.has(method),
		})),
	}
})

const PANE_WIDTH = '320px'

const widestPose = {
	x: -1234.56,
	y: 312.4,
	z: -1234.56,
	oX: -0.7071,
	oY: -0.7071,
	oZ: -0.7071,
	theta: -179.99,
}

const renderInPane = () => {
	render(InPane, { props: { widget: MotionWidget } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

describe('Motion Move widget', () => {
	beforeEach(() => {
		served.dataByMethod.clear()
	})

	it('creates a resource mutation for move and renders the pose editor', () => {
		render(Subject, {
			props: {
				partID: 'test-part',
				resourceName: 'test-motion',
				frameName: 'my-arm',
				destination: 'world',
			},
		})

		expect(createResourceMutation).toHaveBeenCalledWith(expect.anything(), 'move')
		expect(screen.getAllByRole('spinbutton')).toHaveLength(7)
	})
})

describe('Motion composite in a 320 px pane', () => {
	beforeEach(() => {
		localStorage.clear()
		served.dataByMethod.clear()
		served.dataByMethod.set('frameSystemConfig', [
			{ frame: { referenceFrame: 'my-arm-with-a-long-frame-name' } },
			{ frame: { referenceFrame: 'my-gripper' } },
		])
		served.dataByMethod.set('getPose', { pose: widestPose })
	})

	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('draws both frame selects, the seven pose fields, and the two folders collapsed', () => {
		renderInPane()

		expect(screen.getByRole('combobox', { name: 'Component' })).toHaveTextContent(
			'my-arm-with-a-long-frame-name'
		)
		expect(screen.getByRole('combobox', { name: 'Destination frame' })).toHaveTextContent('world')
		expect(screen.getAllByRole('spinbutton')).toHaveLength(7)
		expect(screen.getByRole('button', { name: 'World state' })).toHaveAttribute(
			'aria-expanded',
			'false'
		)
		expect(screen.getByRole('button', { name: 'Constraints' })).toHaveAttribute(
			'aria-expanded',
			'false'
		)
	})

	it('does not scroll horizontally with the widest pose values', () => {
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})

	it('does not scroll horizontally with both folders open on a long line', async () => {
		const longLine = JSON.stringify({ obstacles: Array.from({ length: 40 }, (_, index) => index) })
		localStorage.setItem('test-part/test-motion/motion-move/world-state', JSON.stringify(longLine))
		const user = userEvent.setup()
		const { pane, root } = renderInPane()

		await user.click(screen.getByRole('button', { name: 'World state' }))
		await user.click(screen.getByRole('button', { name: 'Constraints' }))

		expect(screen.getByRole('textbox', { name: 'World state' }).textContent).toContain(longLine)
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
