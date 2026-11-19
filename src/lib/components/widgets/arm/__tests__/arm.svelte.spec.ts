import '../../../../../app.css'

import { render, screen, within } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ArmWidget from '../arm.svelte'
import InPane from './__fixtures__/in-320-pane.svelte'

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	// Manual mode on and joint positions present, so the composite draws every section it can.
	const pose = { x: 1, y: 2, z: 3, oX: 0, oY: 0, oZ: 1, theta: 0 }
	const resourceDataByMethod: Record<string, unknown> = {
		getProperties: { supportManualMode: true, supportCartesianCommands: true },
		getManualMode: false,
		getJointPositions: { values: [0, 10, 20, 30, 40, 50] },
		getEndPosition: pose,
		isMoving: false,
	}
	const robotDataByMethod: Record<string, unknown> = {
		frameSystemConfig: [],
		getPose: { pose, referenceFrame: 'world' },
	}
	const queryResult = (data: unknown) => ({
		data,
		isLoading: false,
		isSuccess: true,
		isError: false,
		error: null,
		refetch: vi.fn(),
	})
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string) =>
			queryResult(resourceDataByMethod[method])
		),
		createRobotQuery: vi.fn((_client: unknown, method: string) =>
			queryResult(robotDataByMethod[method])
		),
		createResourceMutation: vi.fn(() => ({
			mutate: vi.fn(),
			mutateAsync: vi.fn(),
			isPending: false,
			error: null,
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
		useRobotClient: vi.fn(() => ({ current: {} })),
		useResourceStatuses: vi.fn(() => ({ current: [] })),
	}
})

const MUTATOR_HEADINGS = ['SetManualMode', 'MoveToJointPositions', 'MoveToPosition']
const SECTION_HEADINGS = ['IsMoving', 'Stop', ...MUTATOR_HEADINGS, 'GetJointPositions']

const isBefore = (first: Element, second: Element) =>
	(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

const heading = (name: string) => screen.getByRole('heading', { name })

const renderAtWidth = (width: number) => {
	const target = document.createElement('div')
	target.style.width = `${width}px`
	document.body.append(target)
	render(ArmWidget, { props: { partID: 'test-part', resourceName: 'test-arm' }, target })
	return target
}

afterEach(() => {
	document.body.replaceChildren()
})

describe('Arm composite', () => {
	it('draws a heading for each mutator and query section, and none for IsMoving or Stop', () => {
		renderAtWidth(320)

		const counts = Object.fromEntries(
			SECTION_HEADINGS.map((name) => [name, screen.queryAllByRole('heading', { name }).length])
		)
		expect(counts).toEqual({
			IsMoving: 0,
			Stop: 0,
			SetManualMode: 1,
			MoveToJointPositions: 1,
			MoveToPosition: 1,
			GetJointPositions: 1,
		})
	})

	it('draws the glance row as the IsMoving badge and the Stop button, with no heading row', () => {
		renderAtWidth(320)

		const glanceRow = within(screen.getByRole('group', { name: 'At a glance' }))
		expect(glanceRow.getByText('IsMoving')).toBeVisible()
		expect(glanceRow.getByText('Idle')).toBeVisible()
		expect(glanceRow.getByRole('button', { name: 'Stop' })).toBeVisible()
		expect(glanceRow.queryAllByRole('heading')).toEqual([])
	})

	it('gives each glance item its own error indicator', () => {
		renderAtWidth(320)

		const glanceRow = within(screen.getByRole('group', { name: 'At a glance' }))
		expect(glanceRow.getAllByRole('button', { name: 'No errors' })).toHaveLength(2)
	})

	it('puts the glance row first, then the mutators, then the queries', () => {
		renderAtWidth(320)

		const layers: [name: string, element: Element][] = [
			['glance row', screen.getByRole('group', { name: 'At a glance' })],
			...MUTATOR_HEADINGS.map((name): [string, Element] => [name, heading(name)]),
			['GetJointPositions', heading('GetJointPositions')],
		]
		const inDocumentOrder = layers.toSorted(([, first], [, second]) =>
			isBefore(first, second) ? -1 : 1
		)
		expect(inDocumentOrder.map(([name]) => name)).toEqual([
			'glance row',
			'SetManualMode',
			'MoveToJointPositions',
			'MoveToPosition',
			'GetJointPositions',
		])
	})

	it('keeps the glance row on one row at 320 px', () => {
		renderAtWidth(320)

		const glanceRow = within(screen.getByRole('group', { name: 'At a glance' }))
		const badge = glanceRow.getByText('Idle').getBoundingClientRect()
		const stop = glanceRow.getByRole('button', { name: 'Stop' }).getBoundingClientRect()
		expect(stop.top, 'Stop starts above the badge bottom').toBeLessThan(badge.bottom)
		expect(badge.top, 'the badge starts above the Stop bottom').toBeLessThan(stop.bottom)
	})

	it('stacks the move sections below 672 px', () => {
		renderAtWidth(671)

		const joints = heading('MoveToJointPositions').getBoundingClientRect()
		const pose = heading('MoveToPosition').getBoundingClientRect()
		expect(pose.top).toBeGreaterThan(joints.bottom)
	})

	it('puts the move sections in two columns from 672 px', () => {
		renderAtWidth(672)

		const joints = heading('MoveToJointPositions').getBoundingClientRect()
		const pose = heading('MoveToPosition').getBoundingClientRect()
		expect(pose.top).toBe(joints.top)
		expect(pose.left).toBeGreaterThan(joints.right)
	})

	it('gives each move column 664 px at 1328 px', () => {
		renderAtWidth(1328)

		const joints = heading('MoveToJointPositions').closest('section')
		const pose = heading('MoveToPosition').closest('section')
		expect(joints?.getBoundingClientRect().width).toBeCloseTo(664, 0)
		expect(pose?.getBoundingClientRect().width).toBeCloseTo(664, 0)
	})
})

describe('Arm composite in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		render(InPane, { props: { widget: ArmWidget } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
