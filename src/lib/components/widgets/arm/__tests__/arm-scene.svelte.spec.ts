import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createInFlightGuard, type InFlightGuard } from '$lib/components/in-flight-guard.svelte'

import { ArmScene } from '../arm-scene'
import { FIRST_TARGET, SECOND_TARGET } from './__fixtures__/arm-scene-targets'

const PLANNED_TRAJECTORY = [
	{ 'test-arm': [0, 0, 0, 0, 0, 0] },
	{ 'test-arm': [0.1, 0.2, 0, 0, 0, 0] },
]

const state = vi.hoisted(
	(): {
		commands: Record<string, unknown>[]
		planReply: unknown
		isPlanFailing: boolean
		isExecuteHeld: boolean
		releaseExecute: () => void
	} => ({
		commands: [],
		planReply: undefined,
		isPlanFailing: false,
		isExecuteHeld: false,
		releaseExecute: () => undefined,
	})
)

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MotionClient } = await import('@viamrobotics/sdk')
	const fakeMotionClient = {
		doCommand: (command: Record<string, unknown>): Promise<unknown> => {
			state.commands.push(command)
			if ('plan' in command) {
				return state.isPlanFailing
					? Promise.reject(new Error('The planner found no path.'))
					: Promise.resolve(state.planReply)
			}
			if (state.isExecuteHeld) {
				return new Promise((resolve) => {
					state.releaseExecute = () => {
						resolve(null)
					}
				})
			}
			return Promise.resolve(null)
		},
	}
	const actual = await vi.importActual<typeof import('@viamrobotics/svelte-sdk')>(
		'@viamrobotics/svelte-sdk'
	)
	return {
		...actual,
		createResourceClient: (clientClass: unknown) => ({
			current: clientClass === MotionClient ? fakeMotionClient : undefined,
		}),
	}
})

vi.mock('@viamrobotics/visualization/scoped-scene', async () => {
	const actual = await vi.importActual<typeof import('@viamrobotics/visualization/scoped-scene')>(
		'@viamrobotics/visualization/scoped-scene'
	)
	const { default: ScopedScene } = await import('./__fixtures__/arm-scene-scoped-scene.svelte')
	const { default: MoveTargetGizmo } =
		await import('./__fixtures__/arm-scene-move-target-gizmo.svelte')
	const { default: TrajectoryPreview } =
		await import('./__fixtures__/arm-scene-trajectory-preview.svelte')
	return { ...actual, ScopedScene, MoveTargetGizmo, TrajectoryPreview }
})

vi.mock('$lib/components/three/render-loop-guard.svelte', async () => {
	const { default: RenderLoopGuard } =
		await import('./__fixtures__/arm-scene-render-loop-guard.svelte')
	return { default: RenderLoopGuard }
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

const planRequests = () =>
	state.commands
		.map((command) => command.plan)
		.filter((plan) => typeof plan === 'string')
		.map((plan): unknown => JSON.parse(plan))

const plannedPose = (request: unknown): unknown => {
	if (!isRecord(request) || !isRecord(request.destination)) return undefined
	return request.destination.pose
}

const executedTrajectories = () =>
	state.commands.filter((command) => 'execute' in command).map((command) => command.execute)

const button = (name: string) => screen.getByRole('button', { name })

const previewText = () => screen.getByTestId('trajectory-preview').textContent

interface RenderOptions {
	isBuiltin?: boolean
	guard?: InFlightGuard
}

const renderSubject = ({ isBuiltin = true, guard = createInFlightGuard() }: RenderOptions = {}) => {
	const onError = vi.fn<(error: Error | undefined) => void>()
	render(ArmScene, {
		props: { partID: 'test-part', resourceName: 'test-arm', isBuiltin, guard, onError },
	})
	return { onError, guard }
}

describe('ArmScene', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
		state.commands = []
		state.planReply = { plan: PLANNED_TRAJECTORY }
		state.isPlanFailing = false
		state.isExecuteHeld = false
		state.releaseExecute = () => undefined
	})

	it('Focuses the scene on the arm of its part', () => {
		renderSubject()

		const scene = screen.getByTestId('scoped-scene')
		expect(scene.dataset.partId).toBe('test-part')
		expect(scene.dataset.frame).toBe('test-arm')
		expect(screen.getByTestId('move-target-gizmo').dataset.frame).toBe('test-arm')
	})

	it('States the staged goal after a gizmo release', async () => {
		renderSubject()

		expect(screen.getByRole('group', { name: 'Plan preview' })).toBeInTheDocument()
		expect(screen.getByText(/No goal staged/)).toBeInTheDocument()
		expect(button('Preview move')).toHaveAttribute('aria-disabled', 'true')

		await user.click(button('Drag to first target'))

		expect(screen.getByText('Goal staged: X 300.00, Y 140.00, Z 380.00 mm')).toBeInTheDocument()
		expect(button('Preview move')).not.toHaveAttribute('aria-disabled')
		expect(button('Execute plan'), 'nothing is planned yet').toHaveAttribute(
			'aria-disabled',
			'true'
		)
	})

	it('Preview move plans the staged goal and draws the parsed trajectory', async () => {
		renderSubject()

		await user.click(button('Drag to first target'))
		await user.click(button('Preview move'))

		await vi.waitFor(() => {
			expect(previewText()).toBe(JSON.stringify(PLANNED_TRAJECTORY))
		})
		const requests = planRequests()
		expect(requests).toHaveLength(1)
		expect(plannedPose(requests[0])).toEqual(FIRST_TARGET.pose)
		expect(requests[0]).toMatchObject({
			componentName: 'test-arm',
			destination: { referenceFrame: 'world' },
		})
		expect(button('Re-plan preview')).not.toHaveAttribute('aria-disabled')
		expect(button('Execute plan')).not.toHaveAttribute('aria-disabled')
		expect(executedTrajectories(), 'planning never moves the arm').toEqual([])
	})

	it('Execute plan sends the previewed trajectory through the guard', async () => {
		state.isExecuteHeld = true
		const { guard } = renderSubject()

		await user.click(button('Drag to first target'))
		await user.click(button('Preview move'))
		await vi.waitFor(() => {
			expect(button('Execute plan')).not.toHaveAttribute('aria-disabled')
		})
		await user.click(button('Execute plan'))

		await vi.waitFor(() => {
			expect(executedTrajectories()).toEqual([PLANNED_TRAJECTORY])
		})
		expect(guard.isBusy, 'the execute holds the conflict group').toBe(true)
		expect(button('Execute plan')).toHaveAttribute('aria-disabled', 'true')

		state.releaseExecute()
		await vi.waitFor(() => {
			expect(guard.isBusy).toBe(false)
		})
		expect(button('Execute plan')).not.toHaveAttribute('aria-disabled')
	})

	it('Execute plan stays focusable but aria-disabled while the guard is busy', async () => {
		const guard = createInFlightGuard()
		renderSubject({ guard })
		await user.click(button('Drag to first target'))
		await user.click(button('Preview move'))
		await vi.waitFor(() => {
			expect(button('Execute plan')).not.toHaveAttribute('aria-disabled')
		})
		button('Execute plan').focus()

		void guard.run(() => new Promise<void>(() => undefined))

		await vi.waitFor(() => {
			expect(button('Execute plan')).toHaveAttribute('aria-disabled', 'true')
		})
		expect(button('Execute plan')).toHaveFocus()
	})

	it('A press on Execute plan while the guard is busy sends nothing, then or later', async () => {
		const guard = createInFlightGuard()
		let releaseOther: () => void = () => undefined
		renderSubject({ guard })
		await user.click(button('Drag to first target'))
		await user.click(button('Preview move'))
		await vi.waitFor(() => {
			expect(button('Execute plan')).not.toHaveAttribute('aria-disabled')
		})
		void guard.run(
			() =>
				new Promise<void>((resolve) => {
					releaseOther = resolve
				})
		)

		await user.click(button('Execute plan'))
		releaseOther()

		await vi.waitFor(() => {
			expect(guard.isBusy, 'the other call released the group').toBe(false)
		})
		expect(executedTrajectories(), 'a press while busy is dropped, never queued').toEqual([])
		expect(screen.getByRole('status')).toHaveTextContent('Plan ready, 2 steps')
	})

	it('Announces the plan step count once Preview move resolves', async () => {
		renderSubject()
		await user.click(button('Drag to first target'))

		await user.click(button('Preview move'))

		await vi.waitFor(() => {
			expect(screen.getByRole('status')).toHaveTextContent('Plan ready, 2 steps')
		})
	})

	it('Announces a failed plan', async () => {
		state.isPlanFailing = true
		renderSubject()
		await user.click(button('Drag to first target'))

		await user.click(button('Preview move'))

		await vi.waitFor(() => {
			expect(screen.getByRole('status')).toHaveTextContent('Plan failed')
		})
	})

	it('Names the scene region for the arm', () => {
		renderSubject()

		expect(screen.getByRole('region', { name: 'test-arm 3D scene' })).toContainElement(
			screen.getByTestId('scoped-scene')
		)
	})

	it('A new drag invalidates the plan', async () => {
		renderSubject()

		await user.click(button('Drag to first target'))
		await user.click(button('Preview move'))
		await vi.waitFor(() => {
			expect(button('Execute plan')).not.toHaveAttribute('aria-disabled')
		})

		await user.click(button('Drag to second target'))

		expect(button('Execute plan')).toHaveAttribute('aria-disabled', 'true')
		expect(button('Preview move')).not.toHaveAttribute('aria-disabled')
		expect(previewText()).toBe('null')
		expect(screen.getByText('Goal staged: X 320.00, Y 100.00, Z 360.00 mm')).toBeInTheDocument()

		await user.click(button('Preview move'))
		await vi.waitFor(() => {
			expect(planRequests().map((request) => plannedPose(request))).toEqual([
				FIRST_TARGET.pose,
				SECOND_TARGET.pose,
			])
		})
	})

	it('A failed plan reports an Error and the retry clears it', async () => {
		state.isPlanFailing = true
		const { onError } = renderSubject()

		await user.click(button('Drag to first target'))
		await user.click(button('Preview move'))

		await vi.waitFor(() => {
			expect(onError).toHaveBeenLastCalledWith(new Error('The planner found no path.'))
		})
		expect(button('Execute plan')).toHaveAttribute('aria-disabled', 'true')

		state.isPlanFailing = false
		onError.mockClear()
		await user.click(button('Preview move'))

		await vi.waitFor(() => {
			expect(button('Execute plan')).not.toHaveAttribute('aria-disabled')
		})
		expect(onError.mock.calls).toEqual([[undefined]])
	})

	it("A plan reply visualization's parser rejects is reported", async () => {
		state.planReply = { plan: [] }
		const { onError } = renderSubject()

		await user.click(button('Drag to first target'))
		await user.click(button('Preview move'))

		await vi.waitFor(() => {
			expect(onError).toHaveBeenLastCalledWith(
				expect.objectContaining({
					name: 'PlanCommandError',
					message: 'Motion service returned an empty trajectory.',
				})
			)
		})
		expect(button('Execute plan')).toHaveAttribute('aria-disabled', 'true')
	})

	it('Scene and per-frame errors reach onError as Errors', async () => {
		const { onError } = renderSubject({ isBuiltin: false })

		await user.click(button('Fail scene'))
		await user.click(button('Throw in a frame'))

		expect(onError.mock.calls).toEqual([
			[new Error('The scene could not load the frame system.')],
			[new Error('A per-frame task threw.')],
		])
	})

	it('Without builtin, shows the scene with no gizmo or Plan preview', () => {
		renderSubject({ isBuiltin: false })

		expect(screen.getByTestId('scoped-scene')).toBeInTheDocument()
		expect(screen.queryByTestId('move-target-gizmo')).not.toBeInTheDocument()
		expect(screen.queryByTestId('trajectory-preview')).not.toBeInTheDocument()
		expect(screen.queryByRole('group', { name: 'Plan preview' })).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: /Execute plan/ })).not.toBeInTheDocument()
	})
})
