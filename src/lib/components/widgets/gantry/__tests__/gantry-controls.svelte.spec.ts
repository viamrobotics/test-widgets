import '../../../../../app.css'

import { fireEvent, render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../gantry-controls.svelte'
import InPane from './__fixtures__/in-320-pane.svelte'

interface HeldCall {
	method: string
	resolve: (value: unknown) => void
	reject: (reason: Error) => void
}

const state = vi.hoisted(
	(): {
		data: Record<string, unknown>
		mutationData: Record<string, unknown>
		calls: [string, unknown[]][]
		heldMethods: Set<string>
		heldCalls: HeldCall[]
	} => ({
		data: {},
		mutationData: {},
		calls: [],
		heldMethods: new Set(),
		heldCalls: [],
	})
)

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			get data() {
				return state.data[method]
			},
			isLoading: false,
			isSuccess: true,
			isError: false,
			fetchStatus: 'idle',
			error: null,
		})),
		createResourceMutation: vi.fn((_client: unknown, method: string) => ({
			mutate: (args: unknown[]) => {
				state.calls.push([method, args])
			},
			mutateAsync: (args: unknown[]) => {
				state.calls.push([method, args])
				if (!state.heldMethods.has(method)) return Promise.resolve(true)
				return new Promise((resolve, reject) => {
					state.heldCalls.push({ method, resolve, reject })
				})
			},
			get data() {
				return state.mutationData[method]
			},
			isPending: false,
			variables: undefined,
			error: null,
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const POSITIONS = [412.5, 86, 1234.56]
const LENGTHS = [1000, 600, 1500]

const renderSubject = (extra: { axisNames?: string[]; defaultSpeedsMmPerSec?: number[] } = {}) =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-gantry', ...extra } })

const renderAtWidth = (width: number) => {
	const target = document.createElement('div')
	target.style.width = `${width}px`
	document.body.append(target)
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-gantry' }, target })
}

const stepper = (name: string) => screen.getByRole('button', { name })

const settleHeldCalls = () => new Promise((resolve) => setTimeout(resolve, 0))

const resolveOldestHeldCall = async () => {
	const call = state.heldCalls.shift()
	if (call === undefined) throw new Error('No held call to resolve')
	call.resolve(true)
	await settleHeldCalls()
}

const moveCall = (goal: number[]) => ['moveToPosition', [goal, goal.map(() => 50)]]

describe('Gantry controls', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
		state.data = { getPosition: POSITIONS, getLengths: LENGTHS, isMoving: false }
		state.mutationData = {}
		state.calls = []
		state.heldMethods = new Set()
		state.heldCalls = []
	})

	afterEach(() => {
		document.body.replaceChildren()
	})

	it('draws the Controls heading and the glance row of badge, Stop, Home, and Homed', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Controls' })).toBeInTheDocument()
		const glance = within(screen.getByRole('group', { name: 'At a glance' }))
		expect(glance.getByText('Idle')).toBeVisible()
		expect(glance.getByRole('button', { name: 'Stop' })).toBeVisible()
		expect(glance.getByRole('button', { name: 'Home' })).toBeVisible()
		expect(glance.getByRole('group', { name: 'Homed' })).toHaveTextContent('-')
	})

	it('draws one jog row per axis under the glance row', () => {
		renderSubject()

		expect(screen.getByRole('group', { name: 'Axis 0' })).toHaveTextContent(
			'−10 mm 412.50mm +10 mm'
		)
		expect(screen.getByRole('group', { name: 'Axis 1' })).toHaveTextContent('−10 mm 86.00mm +10 mm')
		expect(screen.getByRole('group', { name: 'Axis 2' })).toHaveTextContent(
			'−10 mm 1234.56mm +10 mm'
		)
	})

	it('passes axisNames and defaultSpeedsMmPerSec to the jog rows and the Speed field', async () => {
		renderSubject({ axisNames: ['x', 'y', 'z'], defaultSpeedsMmPerSec: [40, 25] })

		await user.click(stepper('+10 mm, z'))

		expect(screen.getByRole('group', { name: 'x' })).toHaveTextContent('−10 mm 412.50mm +10 mm')
		expect(state.calls).toEqual([
			[
				'moveToPosition',
				[
					[412.5, 86, 1244.56],
					[25, 25, 25],
				],
			],
		])
	})

	it('names axes Axis N and seeds Speed at 50 without the config props', () => {
		renderSubject()

		expect(screen.getByRole('group', { name: 'Axis 2' })).toBeInTheDocument()
		expect(screen.getByRole('spinbutton', { name: 'Speed' })).toHaveValue(50)
	})

	it('reads Homed as Yes after Home returns true', () => {
		state.mutationData = { home: true }

		renderSubject()

		expect(screen.getByRole('group', { name: 'Homed' })).toHaveTextContent('Yes')
	})

	it('clamps a step that would pass the axis length to the length', async () => {
		state.data = { ...state.data, getPosition: [995, 86, 1234.56] }
		renderSubject()

		await user.click(stepper('+10 mm, Axis 0'))

		expect(state.calls, 'an unclamped step would send 1005').toEqual([
			moveCall([1000, 86, 1234.56]),
		])
	})

	it('clamps a step that would pass 0 to 0', async () => {
		state.data = { ...state.data, getPosition: [412.5, 4, 1234.56] }
		renderSubject()

		await user.click(stepper('−10 mm, Axis 1'))

		expect(state.calls, 'an unclamped step would send -6').toEqual([moveCall([412.5, 0, 1234.56])])
	})

	it.each([
		{ end: 'start', positions: [412.5, 0, 1234.56], name: '−10 mm, Axis 1' },
		{ end: 'length', positions: [1000, 86, 1234.56], name: '+10 mm, Axis 0' },
	])('sends nothing from the stepper toward a reached $end', async ({ positions, name }) => {
		state.data = { ...state.data, getPosition: positions }
		renderSubject()

		await user.click(stepper(name))
		await settleHeldCalls()

		expect(stepper(name)).toHaveAttribute('aria-disabled', 'true')
		expect(state.calls).toEqual([])
	})

	it('does not clamp an axis that reports no length', async () => {
		state.data = { ...state.data, getLengths: [1000, 600, 0] }
		renderSubject()

		await user.click(stepper('+10 mm, Axis 2'))

		expect(state.calls).toEqual([moveCall([412.5, 86, 1244.56])])
	})

	it('sends nothing from a jog press while Home is in flight, then or after Home returns', async () => {
		state.heldMethods = new Set(['home'])
		renderSubject()
		await user.click(stepper('Home'))

		await user.click(stepper('+10 mm, Axis 0'))

		expect(state.calls, 'while Home is in flight').toEqual([['home', []]])

		await resolveOldestHeldCall()

		expect(state.calls, 'after Home returns').toEqual([['home', []]])
	})

	it('sends nothing from Home while a step is in flight', async () => {
		state.heldMethods = new Set(['moveToPosition'])
		renderSubject()
		await user.click(stepper('+10 mm, Axis 0'))

		await user.click(stepper('Home'))
		await resolveOldestHeldCall()

		expect(state.calls).toEqual([moveCall([422.5, 86, 1234.56])])
	})

	it('sends a hold its next step only after the last step returns, from the last target', async () => {
		state.heldMethods = new Set(['moveToPosition'])
		renderSubject()

		await user.pointer({ target: stepper('+10 mm, Axis 2'), keys: '[MouseLeft>]' })
		await settleHeldCalls()

		expect(state.calls, 'while the first step is in flight').toEqual([
			moveCall([412.5, 86, 1244.56]),
		])

		await resolveOldestHeldCall()

		expect(state.calls, 'after the first step returns').toEqual([
			moveCall([412.5, 86, 1244.56]),
			moveCall([412.5, 86, 1254.56]),
		])
	})

	it('ends a hold on release, so the step in flight is the last', async () => {
		state.heldMethods = new Set(['moveToPosition'])
		renderSubject()
		await user.pointer({ target: stepper('+10 mm, Axis 2'), keys: '[MouseLeft>]' })

		await user.pointer({ keys: '[/MouseLeft]' })
		await resolveOldestHeldCall()

		expect(state.calls).toEqual([moveCall([412.5, 86, 1244.56])])
	})

	it('ends a hold when a step fails', async () => {
		state.heldMethods = new Set(['moveToPosition'])
		renderSubject()
		await user.pointer({ target: stepper('+10 mm, Axis 2'), keys: '[MouseLeft>]' })

		state.heldCalls.shift()?.reject(new Error('axis 2 did not reach 1244.56 mm'))
		await settleHeldCalls()

		expect(state.calls).toEqual([moveCall([412.5, 86, 1244.56])])
	})

	it('ends a hold at the axis length', async () => {
		state.heldMethods = new Set(['moveToPosition'])
		state.data = { ...state.data, getPosition: [412.5, 86, 1495] }
		renderSubject()
		await user.pointer({ target: stepper('+10 mm, Axis 2'), keys: '[MouseLeft>]' })

		await resolveOldestHeldCall()

		expect(state.calls).toEqual([moveCall([412.5, 86, 1500])])
	})

	it('sends Stop while a step is in flight and ends the hold', async () => {
		state.heldMethods = new Set(['moveToPosition'])
		renderSubject()
		await user.pointer({ target: stepper('+10 mm, Axis 2'), keys: '[MouseLeft>]' })

		await fireEvent.click(stepper('Stop'))
		await resolveOldestHeldCall()

		expect(state.calls).toEqual([moveCall([412.5, 86, 1244.56]), ['stop', []]])
	})

	it('says a held step on the status line', async () => {
		state.heldMethods = new Set(['moveToPosition'])
		renderSubject()

		await user.pointer({ target: stepper('+10 mm, Axis 2'), keys: '[MouseLeft>]' })

		expect(screen.getByTestId('status-line')).toHaveTextContent(
			'Stepping Axis 2 +10 mm. Let go to stop after this step'
		)
	})

	it('says Homing on the status line while Home is in flight', async () => {
		state.heldMethods = new Set(['home'])
		renderSubject()

		await user.click(stepper('Home'))

		expect(screen.getByTestId('status-line')).toHaveTextContent(
			'Homing. Steps resume when it finishes'
		)
	})

	it('marks every stepper aria-disabled while Home is in flight', async () => {
		state.heldMethods = new Set(['home'])
		renderSubject()

		await user.click(stepper('Home'))

		expect(
			screen
				.getAllByRole('button', { name: /^[−+]10 mm, Axis \d$/u })
				.map((button) => button.getAttribute('aria-disabled'))
		).toEqual(['true', 'true', 'true', 'true', 'true', 'true'])
	})

	it('puts Step and Speed beside the jog rows from 672 px', () => {
		renderAtWidth(672)

		const rows = screen.getByRole('group', { name: 'Axes' }).getBoundingClientRect()
		const step = screen.getByRole('combobox', { name: 'Step' }).getBoundingClientRect()
		expect(step.left).toBeGreaterThanOrEqual(rows.right)
		expect(step.top).toBeLessThan(rows.bottom)
	})

	it('puts Step and Speed under the jog rows below 672 px', () => {
		renderAtWidth(671)

		const rows = screen.getByRole('group', { name: 'Axes' }).getBoundingClientRect()
		const step = screen.getByRole('combobox', { name: 'Step' }).getBoundingClientRect()
		expect(step.top).toBeGreaterThanOrEqual(rows.bottom)
	})
})

describe('Gantry controls in a 320 px pane', () => {
	beforeEach(() => {
		state.data = { getPosition: POSITIONS, getLengths: LENGTHS, isMoving: false }
		state.mutationData = { home: true }
	})

	it('does not scroll horizontally', () => {
		render(InPane, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
