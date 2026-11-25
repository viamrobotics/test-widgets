import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Jog from '../ArmJogControl.svelte'
import Joints from '../ArmJointsControl.svelte'
import ArmStateProbe from './__fixtures__/ArmStateProbe.svelte'

interface CallOptions {
	signal?: AbortSignal
}

const state = vi.hoisted(
	(): {
		jointDegrees: number[]
		isExecuteHeld: boolean
		commands: Record<string, unknown>[]
		moves: unknown[][]
	} => ({
		jointDegrees: [],
		isExecuteHeld: false,
		commands: [],
		moves: [],
	})
)

const signalOf = (options: unknown): AbortSignal | undefined => {
	if (typeof options !== 'object' || options === null || !('signal' in options)) return undefined
	const { signal } = options
	return signal instanceof AbortSignal ? signal : undefined
}

const untilAborted = (signal: AbortSignal | undefined) =>
	new Promise<never>((_resolve, reject) => {
		signal?.addEventListener('abort', () => {
			reject(new Error('aborted'))
		})
	})

const fakeMotionClient = vi.hoisted(() => ({
	callOptions: {},
	doCommand: (command: Record<string, unknown>, options?: CallOptions): Promise<unknown> => {
		state.commands.push(command)
		if ('plan' in command) {
			return Promise.resolve({
				plan: [{ 'test-arm': [0, 0, 0, 0, 0, 0] }, { 'test-arm': [0.1, 0, 0, 0, 0, 0] }],
			})
		}
		if (state.isExecuteHeld) {
			return untilAborted(options?.signal)
		}
		return Promise.resolve(null)
	},
	move: (...args: unknown[]): Promise<boolean> => {
		state.moves.push(args)
		return untilAborted(signalOf(args.at(-1)))
	},
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MotionClient } = await import('@viamrobotics/sdk')
	const START_POSE = { x: 300, y: 150, z: 420, oX: 0, oY: 0, oZ: 1, theta: 0 }
	const resourceData = (method: string): unknown => {
		if (method === 'getJointPositions') return { values: state.jointDegrees }
		if (method === 'getKinematics') {
			return {
				kinematic_param_type: 'SVA',
				joints: state.jointDegrees.map(() => ({ min: -180, max: 180 })),
			}
		}
		if (method === 'getProperties') return { supportManualMode: false }
		return false
	}
	const robotData = (method: string): unknown => {
		if (method === 'frameSystemConfig') return [{ frame: { referenceFrame: 'test-arm' } }]
		return { pose: START_POSE, referenceFrame: 'world' }
	}
	const query = (getData: () => unknown) => ({
		get data() {
			return getData()
		},
		error: null,
		fetchStatus: 'idle',
		isLoading: false,
		isSuccess: true,
		refetch: () => Promise.resolve(),
	})
	return {
		createResourceClient: vi.fn((clientClass: unknown) => ({
			current: clientClass === MotionClient ? fakeMotionClient : {},
		})),
		createResourceQuery: vi.fn((_client: unknown, method: string) =>
			query(() => resourceData(method))
		),
		createRobotQuery: vi.fn((_client: unknown, method: string) => query(() => robotData(method))),
		createResourceMutation: vi.fn(() => ({
			mutateAsync: () => Promise.resolve(),
			error: null,
			isPending: false,
		})),
		useRobotClient: vi.fn(() => ({ current: {} })),
		useResourceStatuses: vi.fn(() => ({
			current: [
				{ name: { name: 'builtin', namespace: 'rdk', type: 'service', subtype: 'motion' } },
			],
		})),
	}
})

const PAST_HOLD_DELAY_MS = 500

const wait = (milliseconds: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, milliseconds)
	})

const button = (name: string) => screen.getByRole('button', { name })

const hasExecute = () => state.commands.some((command) => 'execute' in command)

const sectionHeaded = (name: string) => {
	const section = screen.getByRole('heading', { name }).closest('section')
	if (!(section instanceof HTMLElement)) throw new Error(`${name} drew no section`)
	return within(section)
}

const renderUnderOneProvider = () =>
	render(InWidgetsProvider, {
		props: {
			component: [Jog, Joints, ArmStateProbe],
			props: { partID: 'test-part', resourceName: 'test-arm' },
		},
	})

describe('Arm Jog and Joints under one WidgetsProvider', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		localStorage.clear()
		user = userEvent.setup()
		state.jointDegrees = [10, 20, 30, 40, 0, 0]
		state.isExecuteHeld = false
		state.commands = []
		state.moves = []
	})

	it('disables Jog and sends nothing on a Jog press while a Joints hold runs', async () => {
		state.isExecuteHeld = true
		renderUnderOneProvider()
		button('+5°, Joint 0').focus()
		await user.keyboard('[Space>]')
		await vi.waitFor(() => {
			expect(hasExecute(), 'the joint segment is on the arm').toBe(true)
		})
		await wait(PAST_HOLD_DELAY_MS)
		const commandsBeforeJog = state.commands.length

		expect(button('+10 mm, Z')).toHaveAttribute('aria-disabled', 'true')
		await user.click(button('+10 mm, Z'))
		await wait(0)

		expect(state.commands.slice(commandsBeforeJog)).toEqual([])
		expect(state.moves).toEqual([])
	})

	it('disables the Joints steppers and Zero while a Jog step runs', async () => {
		state.isExecuteHeld = true
		renderUnderOneProvider()

		button('+10 mm, Z').focus()
		await user.keyboard('[Space>]')
		await vi.waitFor(() => {
			expect(hasExecute(), 'the jog segment is on the arm').toBe(true)
		})

		expect(button('+5°, Joint 0')).toHaveAttribute('aria-disabled', 'true')
		expect(button('Zero')).toHaveAttribute('aria-disabled', 'true')
	})

	it('writes a Joint step edited in Joints into the state Jog reads', async () => {
		renderUnderOneProvider()
		const joints = sectionHeaded('Joints')
		await user.click(joints.getByRole('button', { name: /^Steps/u }))

		await user.tripleClick(joints.getByRole('spinbutton', { name: 'Joint step' }))
		await user.keyboard('10')

		expect(screen.getByTestId('shared-joint-step')).toHaveTextContent('10')
		expect(button('+10°, Joint 0')).toBeInTheDocument()
	})

	it('steps Jog by a position step written to the shared state', async () => {
		renderUnderOneProvider()

		await user.click(button('Set shared position step'))

		expect(button('+20 mm, Z')).toBeInTheDocument()
	})
})
