import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PopOutHost, PopOutRequest } from '$lib/components/pop-out/pop-out-host-context'

import Subject from '../arm-controls.svelte'
import SceneHost from './__fixtures__/arm-controls-scene-host.svelte'

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
		armCalls: string[]
	} => ({
		motionServiceNames: [],
		jointDegrees: [],
		jointLimits: [],
		supportManualMode: false,
		isManualMode: false,
		isExecuteHeld: false,
		commands: [],
		moves: [],
		armCalls: [],
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
	const { MachineConnectionEvent, MotionClient } = await import('@viamrobotics/sdk')
	const START_POSE = { x: 300, y: 150, z: 420, oX: 0, oY: 0, oZ: 1, theta: 0 }
	const resourceData = (method: string): unknown => {
		if (method === 'getJointPositions') return { values: state.jointDegrees }
		if (method === 'getKinematics') {
			return { kinematic_param_type: 'SVA', joints: state.jointLimits }
		}
		if (method === 'getProperties') return { supportManualMode: state.supportManualMode }
		if (method === 'getManualMode') return state.isManualMode
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
		createResourceMutation: vi.fn((_client: unknown, method: string) => ({
			mutate: () => {
				state.armCalls.push(method)
			},
			mutateAsync: () => {
				state.armCalls.push(method)
				return Promise.resolve()
			},
			error: null,
			isPending: false,
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
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
const PAST_HOLD_DELAY_MS = 500

const wait = (milliseconds: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, milliseconds)
	})

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

const goalRadians = (extra: unknown): unknown => {
	if (!isRecord(extra) || !isRecord(extra.goal_state)) return undefined
	const { configuration } = extra.goal_state
	return isRecord(configuration) ? configuration['test-arm'] : undefined
}

const jointPlanGoals = () =>
	state.commands
		.map((command) => command.plan)
		.filter((plan) => typeof plan === 'string')
		.map((plan) => {
			const request: unknown = JSON.parse(plan)
			return isRecord(request) ? goalRadians(request.extra) : undefined
		})
		.filter((goal) => goal !== undefined)

const radians = (degrees: number[]) => degrees.map((value) => value * DEGREES_TO_RADIANS)

const hasExecute = () => state.commands.some((command) => 'execute' in command)

const button = (name: string) => screen.getByRole('button', { name })

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-arm' } })

describe('ArmControls', () => {
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
		state.armCalls = []
	})

	it('Releasing a hold sends Stop even when a segment is in flight', async () => {
		state.isExecuteHeld = true
		renderSubject()

		button('+10 mm, Z').focus()
		await user.keyboard('[Space>]')
		await vi.waitFor(() => {
			expect(hasExecute(), 'the jog segment is on the arm').toBe(true)
		})
		await wait(PAST_HOLD_DELAY_MS)
		await user.keyboard('[/Space]')

		await vi.waitFor(() => {
			expect(state.armCalls).toEqual(['stop'])
		})
	})

	it('A joint step past its limit is clamped and sends nothing', async () => {
		renderSubject()

		await user.click(button('+5°, Joint 2'))
		await vi.waitFor(() => {
			expect(jointPlanGoals(), 'a step from 178° plans 180°, not 183°').toEqual([
				radians([10, 20, 180, 180, 0, 0]),
			])
		})
		await vi.waitFor(() => {
			expect(button('+5°, Joint 1'), 'the step has settled').not.toHaveAttribute('aria-disabled')
		})

		await user.click(button('+5°, Joint 3'))
		await wait(0)

		expect(jointPlanGoals(), 'a press at 180° plans nothing more').toHaveLength(1)
	})

	it('sends nothing on a jog press while a joint hold runs, since the guard is shared', async () => {
		state.isExecuteHeld = true
		renderSubject()
		button('+5°, Joint 0').focus()
		await user.keyboard('[Space>]')
		await vi.waitFor(() => {
			expect(hasExecute(), 'the joint segment is on the arm').toBe(true)
		})
		await wait(PAST_HOLD_DELAY_MS)
		const commandsBeforeJog = state.commands.length

		await user.click(button('+10 mm, Z'))
		await wait(0)

		expect(state.commands.slice(commandsBeforeJog)).toEqual([])
		expect(state.moves).toEqual([])
	})

	it('sends the arm stop once on Stop and ends a running hold with no second stop', async () => {
		state.isExecuteHeld = true
		renderSubject()
		button('+5°, Joint 0').focus()
		await user.keyboard('[Space>]')
		await vi.waitFor(() => {
			expect(hasExecute(), 'the joint segment is on the arm').toBe(true)
		})
		await wait(PAST_HOLD_DELAY_MS)

		button('Stop').click()
		await user.keyboard('[/Space]')
		await wait(0)

		expect(state.armCalls, 'a release after the delay would add a stop of its own').toEqual([
			'stop',
		])
		expect(button('+5°, Joint 0')).not.toHaveAttribute('aria-busy', 'true')
	})

	it('renders exactly one Steps disclosure', () => {
		renderSubject()

		expect(screen.getAllByRole('button', { name: /^Steps/u })).toHaveLength(1)
	})

	it('renders no Joints folder off the builtin motion service', () => {
		state.motionServiceNames = ['custom-motion']
		renderSubject()

		expect(screen.queryByRole('button', { name: /^Joints/u })).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: '+5°, Joint 0' })).not.toBeInTheDocument()
	})

	it('renders no Manual mode folder when the arm does not support manual mode', () => {
		renderSubject()

		expect(screen.queryByRole('button', { name: /^Manual mode/u })).not.toBeInTheDocument()
	})

	it('renders a closed Manual mode folder when the arm supports manual mode', () => {
		state.supportManualMode = true
		renderSubject()

		expect(button('Manual mode')).toHaveAttribute('aria-expanded', 'false')
	})

	it('shows the Manual mode badge in the glance row while manual mode is on', () => {
		state.supportManualMode = true
		state.isManualMode = true
		renderSubject()

		const glance = screen.getByRole('group', { name: 'At a glance' })
		expect(within(glance).getByText('Manual mode')).toBeInTheDocument()
	})

	it('shows no Manual mode badge while manual mode is off', () => {
		state.supportManualMode = true
		renderSubject()

		const glance = screen.getByRole('group', { name: 'At a glance' })
		expect(within(glance).queryByText('Manual mode')).not.toBeInTheDocument()
	})
})

describe('ArmControls 3D scene', () => {
	const OPEN_SCENE = 'Open 3D scene'
	const NARROW_WIDTH_PX = 320
	const INLINE_WIDTH_PX = 800

	let requests: PopOutRequest[]
	let host: PopOutHost

	beforeEach(() => {
		localStorage.clear()
		state.motionServiceNames = ['builtin']
		state.jointDegrees = [10, 20, 178, 180, 0, 0]
		state.jointLimits = state.jointDegrees.map(() => ({ min: -180, max: 180 }))
		state.supportManualMode = false
		state.commands = []
		state.armCalls = []
		requests = []
		host = {
			open: (request) => {
				requests.push(request)
				return () => undefined
			},
		}
	})

	const renderHost = (props: { width: number; hasScene?: boolean; host?: PopOutHost }) =>
		render(SceneHost, { props })

	it.each([NARROW_WIDTH_PX, INLINE_WIDTH_PX])(
		'renders no scene and no Open 3D scene button at %i px without a scene',
		(width) => {
			renderHost({ width, hasScene: false })

			expect(screen.queryByRole('button', { name: OPEN_SCENE })).not.toBeInTheDocument()
			expect(screen.queryByTestId('stub-scene')).not.toBeInTheDocument()
		}
	)

	it('asks the host to open the scene at 320 px', async () => {
		const user = userEvent.setup()
		renderHost({ width: NARROW_WIDTH_PX, host })

		expect(screen.queryByTestId('stub-scene')).not.toBeInTheDocument()
		await user.click(button(OPEN_SCENE))

		await vi.waitFor(() => {
			expect(requests).toHaveLength(1)
		})
		expect(requests[0]?.title).toBe('arm-1 › Scene')
		expect(requests[0]?.minSize).toEqual({ minWidth: 672, minHeight: 504 })
	})

	it('closes the pop-out on widening and does not reopen it on narrowing', async () => {
		const user = userEvent.setup()
		let closeCount = 0
		const countingHost: PopOutHost = {
			open: (request) => {
				requests.push(request)
				return () => {
					closeCount += 1
				}
			},
		}
		const { rerender } = renderHost({ width: NARROW_WIDTH_PX, host: countingHost })

		await user.click(button(OPEN_SCENE))
		await vi.waitFor(() => {
			expect(requests).toHaveLength(1)
		})

		await rerender({ width: INLINE_WIDTH_PX, host: countingHost })
		await vi.waitFor(() => {
			expect(closeCount).toBe(1)
		})

		await rerender({ width: NARROW_WIDTH_PX, host: countingHost })
		await screen.findByRole('button', { name: OPEN_SCENE })
		await wait(PAST_HOLD_DELAY_MS)
		expect(requests).toHaveLength(1)
	})

	it('moves focus to the inline scene when widening closes the pop-out', async () => {
		const user = userEvent.setup()
		const { rerender } = renderHost({ width: NARROW_WIDTH_PX, host })

		await user.click(button(OPEN_SCENE))
		await vi.waitFor(() => {
			expect(requests).toHaveLength(1)
		})
		expect(button(OPEN_SCENE)).toHaveFocus()

		await rerender({ width: INLINE_WIDTH_PX, host })

		const region = await screen.findByRole('region', { name: 'arm-1 3D scene' })
		await vi.waitFor(() => {
			expect(region).toHaveFocus()
		})
	})

	it('opens a dialog holding the scene at 320 px without a host', async () => {
		const user = userEvent.setup()
		renderHost({ width: NARROW_WIDTH_PX })

		await user.click(button(OPEN_SCENE))

		const dialog = await screen.findByRole('dialog')
		expect(within(dialog).getByTestId('stub-scene')).toBeInTheDocument()
	})

	it('renders the scene inline at 800 px with no Open 3D scene button', async () => {
		renderHost({ width: INLINE_WIDTH_PX })

		await vi.waitFor(() => {
			expect(screen.getByTestId('stub-scene')).toBeInTheDocument()
		})
		expect(screen.queryByRole('button', { name: OPEN_SCENE })).not.toBeInTheDocument()
	})

	it('passes isBuiltin true on the builtin motion service and false off it', async () => {
		const { unmount } = renderHost({ width: INLINE_WIDTH_PX })
		await vi.waitFor(() => {
			expect(screen.getByTestId('stub-scene-props')).toHaveTextContent('test-part|arm-1|true')
		})
		unmount()

		state.motionServiceNames = ['custom-motion']
		renderHost({ width: INLINE_WIDTH_PX })
		await vi.waitFor(() => {
			expect(screen.getByTestId('stub-scene-props')).toHaveTextContent('test-part|arm-1|false')
		})
	})

	it('counts a scene error in the section indicator', async () => {
		const user = userEvent.setup()
		renderHost({ width: INLINE_WIDTH_PX })

		await user.click(await screen.findByRole('button', { name: 'fail scene' }))

		expect(await screen.findByRole('button', { name: '1 error, copy to clipboard' })).toBeVisible()
	})
})
