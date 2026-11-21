import type { JsonValue } from '@viamrobotics/sdk'

import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../arm-joints-control.svelte'

interface CallOptions {
	signal?: AbortSignal
}

const state = vi.hoisted(
	(): {
		motionServiceNames: string[]
		jointDegrees: number[]
		jointLimits: { min: number; max: number }[]
		supportManualMode: boolean
		isManualMode: boolean
		isExecuteHeld: boolean
		commands: Record<string, unknown>[]
		moves: unknown[][]
		stops: unknown[][]
	} => ({
		motionServiceNames: [],
		jointDegrees: [],
		jointLimits: [],
		supportManualMode: false,
		isManualMode: false,
		isExecuteHeld: false,
		commands: [],
		moves: [],
		stops: [],
	})
)

const untilAborted = (options: CallOptions | undefined) =>
	new Promise<never>((_resolve, reject) => {
		options?.signal?.addEventListener('abort', () => {
			reject(new Error('aborted'))
		})
	})

const fakeMotionClient = vi.hoisted(() => ({
	doCommand: (command: Record<string, unknown>, options?: CallOptions): Promise<JsonValue> => {
		state.commands.push(command)
		if ('plan' in command) {
			return Promise.resolve({ plan: [{ 'test-arm': [0, 0, 0, 0, 0, 0] }] })
		}
		if (state.isExecuteHeld) {
			return untilAborted(options)
		}
		return Promise.resolve(null)
	},
	move: (...args: unknown[]): Promise<boolean> => {
		state.moves.push(args)
		const options = args.at(-1)
		const signal =
			typeof options === 'object' && options !== null && 'signal' in options
				? options.signal
				: undefined
		return untilAborted(signal instanceof AbortSignal ? { signal } : undefined)
	},
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MotionClient } = await import('@viamrobotics/sdk')
	const queryData = (method: string): unknown => {
		if (method === 'getJointPositions') return { values: state.jointDegrees }
		if (method === 'getKinematics') {
			return { kinematic_param_type: 'SVA', joints: state.jointLimits }
		}
		if (method === 'getProperties') return { supportManualMode: state.supportManualMode }
		if (method === 'getManualMode') return state.isManualMode
		return false
	}
	const query = (method: string) => ({
		get data() {
			return queryData(method)
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
		createResourceQuery: vi.fn((_client: unknown, method: string) => query(method)),
		createRobotQuery: vi.fn(() => ({
			data: {
				pose: { x: 1, y: 2, z: 3, oX: 0, oY: 0, oZ: 1, theta: 0 },
				referenceFrame: 'world',
			},
			error: null,
			fetchStatus: 'idle',
			isLoading: false,
			isSuccess: true,
		})),
		createResourceMutation: vi.fn(() => ({
			mutateAsync: (args: unknown[]) => {
				state.stops.push(args)
				return Promise.resolve()
			},
			error: null,
			isPending: false,
		})),
		useRobotClient: vi.fn(() => ({ current: {} })),
		useResourceStatuses: vi.fn(() => ({
			get current() {
				return state.motionServiceNames.map((name) => ({
					name: { name, namespace: 'rdk', type: 'service', subtype: 'motion' },
				}))
			},
		})),
	}
})

const DEGREES_TO_RADIANS = Math.PI / 180
const HOLD_PAST_DELAY_MS = 450

const wait = (milliseconds: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, milliseconds)
	})

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

/** The arm's joint goal in radians, read from a `goal_state` extra. */
const goalRadians = (extra: unknown): unknown => {
	if (!isRecord(extra) || !isRecord(extra.goal_state)) return undefined
	const { configuration } = extra.goal_state
	return isRecord(configuration) ? configuration['test-arm'] : undefined
}

const planGoals = () =>
	state.commands
		.map((command) => command.plan)
		.filter((plan) => typeof plan === 'string')
		.map((plan) => {
			const request: unknown = JSON.parse(plan)
			return isRecord(request) ? goalRadians(request.extra) : undefined
		})

const radians = (degrees: number[]) => degrees.map((value) => value * DEGREES_TO_RADIANS)

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-arm' } })

describe('ArmJointsControl', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		localStorage.clear()
		user = userEvent.setup()
		state.motionServiceNames = ['builtin']
		state.jointDegrees = [10, 20, 178, 180, 0, 0]
		state.jointLimits = state.jointDegrees.map(() => ({ min: -180, max: 180 }))
		state.supportManualMode = false
		state.isManualMode = false
		state.isExecuteHeld = false
		state.commands = []
		state.moves = []
		state.stops = []
	})

	it('renders a row per joint with its current angle and a range bar', () => {
		renderSubject()

		expect(screen.getByRole('group', { name: 'Joint 1' })).toHaveTextContent('−5° 20.00° +5°')
		expect(screen.getAllByTestId('jog-track')).toHaveLength(state.jointDegrees.length)
	})

	it('plans joint 1 at its start plus 5° with every other joint held', async () => {
		renderSubject()

		await user.click(screen.getByRole('button', { name: '+5°, Joint 1' }))

		await waitFor(() => {
			expect(planGoals()).toEqual([radians([10, 25, 178, 180, 0, 0])])
		})
	})

	it('clamps a step from 178° to the 180° limit', async () => {
		renderSubject()

		await user.click(screen.getByRole('button', { name: '+5°, Joint 2' }))

		await waitFor(() => {
			expect(planGoals()).toEqual([radians([10, 20, 180, 180, 0, 0])])
		})
	})

	it('sends nothing for a press at the limit', async () => {
		renderSubject()

		await user.click(screen.getByRole('button', { name: '+5°, Joint 3' }))
		await wait(0)

		expect(state.commands).toEqual([])
	})

	it('ends a hold at the limit with a status line and no error', async () => {
		renderSubject()

		await user.pointer({
			target: screen.getByRole('button', { name: '+5°, Joint 2' }),
			keys: '[MouseLeft>]',
		})

		await waitFor(() => {
			expect(screen.getByTestId('status-line')).toHaveTextContent('Joint 2 at its limit')
		})
		await user.pointer({ keys: '[/MouseLeft]' })
		expect(screen.queryByText(/JointLimitReachedError/u)).not.toBeInTheDocument()
		expect(screen.queryByText('1 error')).not.toBeInTheDocument()
	})

	it('sends the arm stop on a release after the hold delay', async () => {
		state.isExecuteHeld = true
		renderSubject()

		await user.pointer({
			target: screen.getByRole('button', { name: '+5°, Joint 0' }),
			keys: '[MouseLeft>]',
		})
		await waitFor(() => {
			expect(state.commands.some((command) => 'execute' in command)).toBe(true)
		})
		await wait(HOLD_PAST_DELAY_MS)
		expect(state.stops).toEqual([])
		await user.pointer({ keys: '[/MouseLeft]' })

		expect(state.stops).toEqual([[]])
	})

	it('marks the held stepper busy and another joint stepper disabled while a hold runs', async () => {
		state.isExecuteHeld = true
		renderSubject()
		const held = screen.getByRole('button', { name: '+5°, Joint 0' })

		await user.pointer({ target: held, keys: '[MouseLeft>]' })
		await waitFor(() => {
			expect(state.commands.some((command) => 'execute' in command)).toBe(true)
		})

		const other = screen.getByRole('button', { name: '+5°, Joint 1' })
		expect(held).toHaveAttribute('aria-busy', 'true')
		expect(other).toHaveAttribute('aria-disabled', 'true')
		expect(other).not.toHaveAttribute('aria-busy')
		await user.pointer({ keys: '[/MouseLeft]' })
	})

	it('describes a joint stepper and Zero with the manual mode line while manual mode is on', () => {
		state.supportManualMode = true
		state.isManualMode = true
		renderSubject()

		expect(screen.getByRole('button', { name: '+5°, Joint 0' })).toHaveAccessibleDescription(
			'Exit manual mode to move'
		)
		expect(screen.getByRole('button', { name: 'Zero' })).toHaveAccessibleDescription(
			'Exit manual mode to move'
		)
	})

	it('moves to all zeros while Zero is held and stops on release', async () => {
		renderSubject()

		await user.pointer({
			target: screen.getByRole('button', { name: 'Zero' }),
			keys: '[MouseLeft>]',
		})

		expect(state.moves.map((args) => goalRadians(args[4]))).toEqual([radians([0, 0, 0, 0, 0, 0])])
		expect(screen.getByTestId('status-line')).toHaveTextContent('Moving to Zero')
		expect(state.stops).toEqual([])
		await user.pointer({ keys: '[/MouseLeft]' })

		expect(state.stops).toEqual([[]])
	})

	it('shows Home only once Set current as home saves one', async () => {
		renderSubject()
		expect(screen.queryByRole('button', { name: 'Home' })).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Set current as home' }))

		expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument()
	})

	it('shows the builtin requirement and no rows on another motion service', () => {
		state.motionServiceNames = ['custom-motion']
		renderSubject()

		expect(screen.getByText('Joint jogging needs the builtin motion service.')).toBeInTheDocument()
		expect(screen.queryByRole('group', { name: 'Joint 0' })).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Zero' })).not.toBeInTheDocument()
	})

	it('marks every stepper aria-disabled while manual mode is on', () => {
		state.supportManualMode = true
		state.isManualMode = true
		renderSubject()

		const steppers = screen.getAllByRole('button', { name: /^[−+]5°, Joint \d$/u })
		expect(steppers).toHaveLength(state.jointDegrees.length * 2)
		for (const stepper of steppers) {
			expect(stepper).toHaveAttribute('aria-disabled', 'true')
		}
		expect(screen.getByRole('button', { name: 'Zero' })).toHaveAttribute('aria-disabled', 'true')
	})
})
