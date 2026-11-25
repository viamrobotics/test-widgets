import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import Subject from '../arm-jog-control.svelte'

interface PendingCall {
	args: unknown[]
	signal: AbortSignal | undefined
	resolve: (value: unknown) => void
}

interface JogPoseData {
	x: number
	y: number
	z: number
	oX: number
	oY: number
	oZ: number
	theta: number
}

const state = vi.hoisted(
	(): {
		serviceNames: string[]
		frameNames: string[]
		pose: JogPoseData | undefined
		properties: { supportManualMode: boolean } | undefined
		manualMode: boolean
		moves: PendingCall[]
		commands: PendingCall[]
		armCalls: string[]
		isMoveHeld: boolean
		isExecuteHeld: boolean
	} => ({
		serviceNames: [],
		frameNames: [],
		pose: undefined,
		properties: undefined,
		manualMode: false,
		moves: [],
		commands: [],
		armCalls: [],
		isMoveHeld: false,
		isExecuteHeld: false,
	})
)

const signalOf = (callOptions: unknown): AbortSignal | undefined => {
	if (typeof callOptions !== 'object' || callOptions === null || !('signal' in callOptions)) {
		return undefined
	}
	const { signal } = callOptions
	return signal instanceof AbortSignal ? signal : undefined
}

const recordCall = (calls: PendingCall[], args: unknown[], isHeld: boolean, value: unknown) => {
	const signal = signalOf(args.at(-1))
	return new Promise((resolve, reject) => {
		calls.push({ args, signal, resolve })
		signal?.addEventListener('abort', () => {
			reject(new Error('aborted'))
		})
		if (!isHeld) resolve(value)
	})
}

const BUILTIN_TRAJECTORY = [
	{ 'test-arm': [0, 0, 0, 0, 0, 0] },
	{ 'test-arm': [0.1, 0, 0, 0, 0, 0] },
]

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MotionClient } = await import('@viamrobotics/sdk')
	const motion = {
		callOptions: {},
		move: (...args: unknown[]) => recordCall(state.moves, args, state.isMoveHeld, true),
		doCommand: (...args: unknown[]) => {
			const [command] = args
			const isPlan = typeof command === 'object' && command !== null && 'plan' in command
			const isHeld = !isPlan && state.isExecuteHeld
			return recordCall(state.commands, args, isHeld, isPlan ? { plan: BUILTIN_TRAJECTORY } : true)
		},
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
	const resourceData: Record<string, () => unknown> = {
		getProperties: () => state.properties,
		getManualMode: () => state.manualMode,
		isMoving: () => false,
	}
	return {
		createResourceClient: vi.fn((resourceClass: unknown) => ({
			current: resourceClass === MotionClient ? motion : {},
		})),
		createResourceQuery: vi.fn((_client: unknown, method: string) =>
			query(() => resourceData[method]?.())
		),
		createResourceMutation: vi.fn((_client: unknown, method: string) => ({
			mutateAsync: () => {
				state.armCalls.push(method)
				return Promise.resolve()
			},
			error: null,
			isPending: false,
		})),
		createRobotQuery: vi.fn((_client: unknown, method: string) => {
			if (method === 'frameSystemConfig') {
				return query(() =>
					state.frameNames.map((referenceFrame) => ({ frame: { referenceFrame } }))
				)
			}
			return query(() =>
				state.pose === undefined ? undefined : { pose: state.pose, referenceFrame: 'world' }
			)
		}),
		useRobotClient: vi.fn(() => ({ current: {} })),
		useResourceStatuses: vi.fn(() => ({
			get current() {
				return state.serviceNames.map((name) => ({ name: { name } }))
			},
		})),
	}
})

const HOLD_DELAY_MS = 400
const PAST_HOLD_DELAY_MS = HOLD_DELAY_MS + 100
const START_POSE: JogPoseData = { x: 300, y: 150, z: 420, oX: 0, oY: 0, oZ: 1, theta: 0 }
const GRIPPER_DOWN_POSE: JogPoseData = { ...START_POSE, oZ: -1 }

const renderSubject = () =>
	render(InWidgetsProvider, {
		props: { component: Subject, props: { partID: 'test-part', resourceName: 'test-arm' } },
	})

const stepper = (name: string) => screen.getByRole('button', { name })

const wait = (ms: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms)
	})

const destinationZ = (call: PendingCall | undefined): unknown => {
	const [destination] = call?.args ?? []
	if (typeof destination !== 'object' || destination === null || !('pose' in destination)) {
		return undefined
	}
	const { pose } = destination
	return typeof pose === 'object' && pose !== null && 'z' in pose ? pose.z : undefined
}

const commandVerb = (call: PendingCall): string | undefined => {
	const [command] = call.args
	if (typeof command !== 'object' || command === null) return undefined
	return Object.keys(command).find((key) => key === 'plan' || key === 'execute')
}

const resolvePending = async (calls: PendingCall[]) => {
	for (const call of calls) call.resolve(true)
	await wait(0)
}

describe('ArmJogControl', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
		state.serviceNames = ['motion-1']
		state.frameNames = ['test-arm']
		state.pose = START_POSE
		state.properties = undefined
		state.manualMode = false
		state.moves = []
		state.commands = []
		state.armCalls = []
		state.isMoveHeld = true
		state.isExecuteHeld = false
	})

	afterEach(() => {
		document.body.replaceChildren()
	})

	it('sends one move to the start z plus 10 on a World Z+ click off builtin', async () => {
		renderSubject()

		await user.click(stepper('+10 mm, Z'))
		await vi.waitFor(() => {
			expect(state.moves).toHaveLength(1)
		})
		await resolvePending(state.moves)

		expect(state.moves, 'a click is one step, so no second move follows').toHaveLength(1)
		expect(destinationZ(state.moves[0])).toBeCloseTo(START_POSE.z + 10)
		expect(state.commands).toEqual([])
	})

	it('reads Stepping in the status line while a step runs off builtin', async () => {
		renderSubject()

		await user.click(stepper('−10 mm, X'))

		await vi.waitFor(() => {
			expect(screen.getByTestId('status-line')).toHaveTextContent('Stepping X −10 mm')
		})
	})

	it('sends a plan doCommand, then an execute, on builtin', async () => {
		state.serviceNames = ['builtin', 'motion-1']
		renderSubject()

		await user.click(stepper('+10 mm, Z'))

		await vi.waitFor(() => {
			expect(state.commands.map((call) => commandVerb(call))).toEqual(['plan', 'execute'])
		})
		expect(state.moves).toEqual([])
	})

	it('sends the arm stop on a release after the hold delay', async () => {
		renderSubject()

		stepper('+10 mm, Z').focus()
		await user.keyboard('[Space>]')
		await vi.waitFor(() => {
			expect(state.moves).toHaveLength(1)
		})
		await wait(PAST_HOLD_DELAY_MS)
		await user.keyboard('[/Space]')

		await vi.waitFor(() => {
			expect(state.armCalls).toEqual(['stop'])
		})
	})

	it('sends the arm stop on a release after the hold delay while a builtin segment runs', async () => {
		state.serviceNames = ['builtin']
		state.isExecuteHeld = true
		renderSubject()

		stepper('+10 mm, Z').focus()
		await user.keyboard('[Space>]')
		await vi.waitFor(() => {
			expect(state.commands.map((call) => commandVerb(call))).toContain('execute')
		})
		await wait(PAST_HOLD_DELAY_MS)
		await user.keyboard('[/Space]')

		await vi.waitFor(() => {
			expect(state.armCalls).toEqual(['stop'])
		})
	})

	it('sends no stop on a release before the hold delay', async () => {
		renderSubject()

		await user.click(stepper('+10 mm, Z'))
		await resolvePending(state.moves)

		expect(state.armCalls).toEqual([])
	})

	it('lowers the goal world z on End effector Z+ with the gripper pointing down', async () => {
		state.pose = GRIPPER_DOWN_POSE
		renderSubject()

		await user.click(screen.getByRole('radio', { name: 'End effector' }))
		expect(screen.getByRole('group', { name: 'End effector position' })).toBeInTheDocument()
		await user.click(stepper('+10 mm, Z'))

		await vi.waitFor(() => {
			expect(state.moves).toHaveLength(1)
		})
		expect(destinationZ(state.moves[0]), 'a world step would raise z to 430').toBeCloseTo(
			GRIPPER_DOWN_POSE.z - 10
		)
	})

	it('marks every stepper aria-disabled while manual mode is on', () => {
		state.properties = { supportManualMode: true }
		state.manualMode = true
		renderSubject()

		const steppers = screen.getAllByRole('button', { name: /mm, [XYZ]$/u })
		expect(steppers.map((button) => button.getAttribute('aria-disabled'))).toEqual([
			'true',
			'true',
			'true',
			'true',
			'true',
			'true',
		])
	})

	it('describes each stepper with the exit manual mode hint while manual mode is on', () => {
		state.properties = { supportManualMode: true }
		state.manualMode = true
		renderSubject()

		expect(stepper('+10 mm, Z')).toHaveAccessibleDescription('Exit manual mode to move')
	})

	it('shows the held stepper busy while its step runs', async () => {
		renderSubject()

		await user.click(stepper('+10 mm, Z'))

		await vi.waitFor(() => {
			expect(stepper('+10 mm, Z')).toHaveAttribute('aria-busy', 'true')
		})
	})

	it('disables, without marking busy, a stepper in another row while a step runs', async () => {
		renderSubject()

		await user.click(stepper('+10 mm, Z'))
		await vi.waitFor(() => {
			expect(state.moves).toHaveLength(1)
		})

		expect(stepper('+10 mm, X')).toHaveAttribute('aria-disabled', 'true')
		expect(stepper('+10 mm, X')).not.toHaveAttribute('aria-busy')
	})

	it('leaves the steppers enabled when the arm does not support manual mode', () => {
		state.properties = { supportManualMode: false }
		state.manualMode = true
		renderSubject()

		expect(stepper('+10 mm, Z')).not.toHaveAttribute('aria-disabled')
	})

	it('shows the no motion service text and no stepper without a motion service', () => {
		state.serviceNames = []
		renderSubject()

		expect(
			screen.getByText('Jogging needs a motion service that can move this arm.')
		).toBeInTheDocument()
		expect(screen.queryAllByRole('button', { name: /mm, [XYZ]$/u })).toEqual([])
	})

	it('shows the no motion service text when the motion service cannot plan for the arm', () => {
		state.frameNames = ['some-other-arm']
		renderSubject()

		expect(
			screen.getByText('Jogging needs a motion service that can move this arm.')
		).toBeInTheDocument()
		expect(screen.queryAllByRole('button', { name: /mm, [XYZ]$/u })).toEqual([])
	})

	it('sends nothing on a press before the pose has loaded', async () => {
		state.pose = undefined
		renderSubject()

		await user.click(stepper('+10 mm, Z'))
		await wait(0)

		expect(state.moves).toEqual([])
	})

	it('draws the Jog heading and the Steps folder standalone', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Jog' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Steps/u })).toBeInTheDocument()
	})
})
