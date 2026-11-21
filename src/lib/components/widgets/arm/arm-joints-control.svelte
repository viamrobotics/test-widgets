<script lang="ts">
	import {
		ArmClient,
		type GetKinematicsResult,
		type JsonValue,
		type KinematicsData,
		MotionClient,
		type RobotClient,
	} from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
		createRobotQuery,
		useResourceStatuses,
		useRobotClient,
	} from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import { createInFlightGuard, type InFlightGuard } from '$lib/components/in-flight-guard.svelte'
	import JogRow from '$lib/components/jog-row.svelte'
	import { type JogDirection, jogTarget } from '$lib/components/jog-target'
	import { pressAndHold } from '$lib/components/press-and-hold'
	import { Section, useSectionErrors } from '$lib/components/section'
	import { errorKey } from '$lib/components/section/error-key'
	import StatusLine from '$lib/components/status-line.svelte'

	import type { JogPose } from './jog-pose-goal'

	import { createArmHome } from './arm-home.svelte'
	import { type ArmJogSteps, createArmJogSteps } from './arm-jog-steps.svelte'
	import ArmStepsFolder from './arm-steps-folder.svelte'
	import {
		executeCommand,
		joinTrajectories,
		parsePlanResult,
		planCommand,
		PlanCommandError,
		type TrajectoryStep,
	} from './builtin-plan-command'
	import { getJointPositionLimits } from './joint-position-limits'
	import { jointGoalMoveArgs } from './motion-jog-request'
	import { moveMotionServiceName } from './move-control-mode'
	import { useArmMotionTracking } from './use-arm-motion-tracking.svelte'
	import {
		type LookaheadDriver,
		type RunWhileHeldDriver,
		SEGMENTS_PER_EXECUTE,
		useSegmentedHold,
	} from './use-segmented-hold.svelte'
	import { DEFAULT_JOG_QUEUE_TIMING } from './useJogQueue.svelte'

	interface Props {
		partID: string
		resourceName: string
		/** Body only, inside the host's folder: no heading, no Steps folder of its own. */
		isEmbedded?: boolean
		/** The arm's motion conflict group. The composite passes one guard to `jog` and `joints`. */
		guard?: InFlightGuard
		/** Step sizes. The composite passes one object and renders the Steps folder itself. */
		steps?: ArmJogSteps
	}

	const {
		partID,
		resourceName,
		isEmbedded = false,
		guard: hostGuard,
		steps: hostSteps,
	}: Props = $props()

	type HeldControl =
		| { kind: 'joint'; joint: number; direction: JogDirection }
		| { kind: 'zero' }
		| { kind: 'home' }

	interface JointPlan {
		trajectory: TrajectoryStep[]
		jointDegrees: number[]
	}

	class JointLimitReachedError extends Error {
		readonly joint: number

		constructor(joint: number) {
			super(`Joint ${joint} is at its limit.`)
			this.name = 'JointLimitReachedError'
			this.joint = joint
		}
	}

	const BUILTIN_MOTION_SERVICE = 'builtin'
	const MANUAL_MODE_REFETCH_INTERVAL_MS = 1000
	const READOUT_DECIMALS = 2
	const DEGREES_UNIT = '°'
	const MANUAL_MODE_TEXT = 'Exit manual mode to move'
	const ZERO_LABEL = 'Zero'
	const HOME_LABEL = 'Home'
	const DIRECTION_SYMBOL: Record<JogDirection, string> = { decrease: '−', increase: '+' }

	const instanceId = $props.id()
	const manualModeHintId = `${instanceId}-manual-mode`

	const motionServices = useResourceStatuses(() => partID, 'motion')
	const motionServiceName = $derived(
		moveMotionServiceName(
			motionServices.current
				.map((service) => service.name?.name)
				.filter((name): name is string => name !== undefined)
		)
	)
	const isBuiltin = $derived(motionServiceName === BUILTIN_MOTION_SERVICE)

	const armClient = createResourceClient(
		ArmClient,
		() => partID,
		() => resourceName
	)
	const motionClient = createResourceClient(
		MotionClient,
		() => partID,
		() => motionServiceName ?? ''
	)
	const robotClient = useRobotClient(() => partID)

	const stopMutation = createResourceMutation(armClient, 'stop')

	const ownGuard = createInFlightGuard()
	const guard = $derived(hostGuard ?? ownGuard)
	const ownSteps = createArmJogSteps()
	const steps = $derived(hostSteps ?? ownSteps)

	const hold = useSegmentedHold({
		get guard() {
			return guard
		},
		stop: () => stopMutation.mutateAsync([]),
		holdDelayMs: DEFAULT_JOG_QUEUE_TIMING.holdRepeatDelayMs,
		segmentsPerExecute: SEGMENTS_PER_EXECUTE,
	})

	$effect(() => () => {
		hold.release()
	})

	const motionTracking = useArmMotionTracking(armClient, {
		isMovePending: () => hold.phase !== 'idle',
		refetchPosition: () => jointPositionsQuery.refetch(),
	})
	const refetchInterval = $derived(motionTracking.refetchInterval)

	const jointPositionsQuery = createResourceQuery(armClient, 'getJointPositions', () => ({
		refetchInterval,
	}))
	const kinematicsQuery = createResourceQuery(armClient, 'getKinematics', {
		refetchInterval: false,
	})
	const poseQuery = createRobotQuery(
		robotClient,
		'getPose',
		() => [resourceName, 'world', []] satisfies Parameters<RobotClient['getPose']>,
		() => ({ refetchInterval, enabled: isBuiltin })
	)
	const propertiesQuery = createResourceQuery(armClient, 'getProperties')
	const supportsManualMode = $derived(propertiesQuery.data?.supportManualMode === true)
	const manualModeQuery = createResourceQuery(armClient, 'getManualMode', () => ({
		refetchInterval: MANUAL_MODE_REFETCH_INTERVAL_MS,
		enabled: supportsManualMode,
	}))
	const isManualMode = $derived(manualModeQuery.data === true)

	$effect(() => {
		if (isManualMode) {
			untrack(() => {
				hold.cancel()
			})
		}
	})

	const armHome = createArmHome(() => ({ partID, resourceName }))

	const kinematicsData = (result: GetKinematicsResult): KinematicsData =>
		'kinematicsData' in result ? result.kinematicsData : result

	const jointLimits = $derived(
		kinematicsQuery.data ? getJointPositionLimits(kinematicsData(kinematicsQuery.data)) : []
	)
	const jointDegrees: number[] | undefined = $derived(jointPositionsQuery.data?.values)
	const currentPose: JogPose | undefined = $derived(poseQuery.data?.pose)

	const limitReachedError = $derived(
		hold.failure instanceof JointLimitReachedError ? hold.failure : undefined
	)
	const holdError = $derived(limitReachedError === undefined ? (hold.failure ?? null) : null)

	const sectionErrors = useSectionErrors(() => ({
		queries: [jointPositionsQuery, kinematicsQuery, poseQuery, propertiesQuery, manualModeQuery],
		mutations: [stopMutation, { error: holdError }],
	}))

	let pressedControl = $state.raw<HeldControl | undefined>()
	const heldControl = $derived(hold.phase === 'idle' ? undefined : pressedControl)

	const isMoveBlocked = $derived(isManualMode || currentPose === undefined)
	const isGroupBusy = $derived(guard.isBusy || isMoveBlocked)

	const jointLabel = (joint: number) => `Joint ${joint}`
	const formatDegrees = (value: number) => value.toFixed(READOUT_DECIMALS)

	const movingText = (control: HeldControl) => {
		if (control.kind === 'zero') {
			return `Moving to ${ZERO_LABEL}`
		}
		if (control.kind === 'home') {
			return `Moving to ${HOME_LABEL}`
		}
		const moving = `Moving ${jointLabel(control.joint)} ${DIRECTION_SYMBOL[control.direction]}`
		return hold.phase === 'moving-next-planned' ? `${moving}, next segment planned` : moving
	}

	const statusText = $derived.by(() => {
		if (heldControl !== undefined) {
			return movingText(heldControl)
		}
		if (limitReachedError !== undefined) {
			return `${jointLabel(limitReachedError.joint)} at its limit`
		}
		return ''
	})

	const connectedMotionClient = () => {
		const client = motionClient.current
		if (client === undefined) {
			throw new Error('The motion service is not connected.')
		}
		return client
	}

	const sendDoCommand = (command: Record<string, JsonValue>, signal: AbortSignal) =>
		connectedMotionClient().doCommand(command, { signal })

	const jointPlanDriver = (
		joint: number,
		direction: JogDirection,
		start: number[],
		pose: JogPose
	): LookaheadDriver<JointPlan> => {
		const step = steps.jointDegrees
		const limit = jointLimits.at(joint)
		const nextJointDegrees = (previous: JointPlan | undefined) => {
			const from = previous?.jointDegrees ?? start
			const target = jogTarget({
				start: from[joint],
				direction,
				step,
				min: limit?.minDegrees,
				max: limit?.maxDegrees,
			})
			if (target === undefined) {
				throw new JointLimitReachedError(joint)
			}
			return from.map((degrees, index) => (index === joint ? target : degrees))
		}
		return {
			kind: 'lookahead',
			planStep: async (_stepNumber, previous, signal) => {
				const goal = nextJointDegrees(previous)
				const moveArgs = jointGoalMoveArgs({
					armName: resourceName,
					currentPose: pose,
					jointDegrees: goal,
				})
				const reply = await sendDoCommand(
					planCommand(moveArgs, previous?.trajectory.at(-1)),
					signal
				)
				return { trajectory: parsePlanResult(reply), jointDegrees: goal }
			},
			joinPlans: (plans) => {
				const last = plans.at(-1)
				if (last === undefined) {
					throw new PlanCommandError('There are no plans to join.')
				}
				return {
					trajectory: joinTrajectories(plans.map((plan) => plan.trajectory)),
					jointDegrees: last.jointDegrees,
				}
			},
			executePlan: async (plan, signal) => {
				await sendDoCommand(executeCommand(plan.trajectory), signal)
			},
			// The execute's start check covers where the arm is. Manual mode is the one change the browser sees.
			isPlanCurrent: () => !isManualMode,
		}
	}

	const jointGoalDriver = (goal: readonly number[], pose: JogPose): RunWhileHeldDriver => ({
		kind: 'run-while-held',
		run: async (signal) => {
			const [destination, componentName, worldState, constraints, extra] = jointGoalMoveArgs({
				armName: resourceName,
				currentPose: pose,
				jointDegrees: goal,
			})
			await connectedMotionClient().move(
				destination,
				componentName,
				worldState,
				constraints,
				extra,
				{ signal }
			)
		},
	})

	const pressJoint = (joint: number, direction: JogDirection) => {
		const start = jointDegrees
		const pose = currentPose
		if (start === undefined || pose === undefined || isMoveBlocked) {
			return
		}
		const control: HeldControl = { kind: 'joint', joint, direction }
		if (hold.press(jointPlanDriver(joint, direction, start, pose))) {
			pressedControl = control
		}
	}

	const pressGoal = (control: HeldControl, goal: readonly number[] | undefined) => {
		const pose = currentPose
		if (goal === undefined || pose === undefined || isMoveBlocked) {
			return
		}
		if (hold.press(jointGoalDriver(goal, pose))) {
			pressedControl = control
		}
	}

	const zeroGoal = () => jointDegrees?.map(() => 0)

	// Only the control whose press the engine took may end the hold, so a refused press never releases another's.
	const releaseIf = (isPressed: (control: HeldControl) => boolean) => {
		if (pressedControl !== undefined && isPressed(pressedControl)) {
			hold.release()
		}
	}

	const releaseJoint = (joint: number) => {
		releaseIf((control) => control.kind === 'joint' && control.joint === joint)
	}

	const heldJointDirection = (joint: number): JogDirection | undefined => {
		if (heldControl?.kind !== 'joint' || heldControl.joint !== joint) {
			return undefined
		}
		return heldControl.direction
	}

	const manualModeDescription = $derived(isManualMode ? manualModeHintId : undefined)

	const isGoalDisabled = (kind: HeldControl['kind']) =>
		isMoveBlocked || (guard.isBusy && heldControl?.kind !== kind)

	const setCurrentAsHome = () => {
		if (jointDegrees !== undefined) {
			armHome.save(jointDegrees)
		}
	}

	/** Stop was pressed in the host: ends the hold and drops any queued plan, with no Stop of its own. */
	export const cancelHold = () => {
		hold.cancel()
	}
</script>

{#snippet goalButton(
	kind: 'zero' | 'home',
	label: string,
	goal: () => readonly number[] | undefined
)}
	{@const isHeld = heldControl?.kind === kind}
	<button
		type="button"
		class="button button-xs touch-none"
		aria-disabled={isGoalDisabled(kind) || undefined}
		aria-busy={isHeld}
		aria-describedby={manualModeDescription}
		{@attach pressAndHold({
			onPress: () => {
				if (!isGoalDisabled(kind)) pressGoal({ kind }, goal())
			},
			onRelease: () => {
				releaseIf((control) => control.kind === kind)
			},
		})}
	>
		{label}
		{#if isHeld}
			<span
				class="progress-dots"
				aria-hidden="true"
			></span>
		{/if}
	</button>
{/snippet}

{#snippet controls()}
	<Section.Body isLoading={sectionErrors.isLoading}>
		{#if isBuiltin}
			<div class="flex w-full min-w-0 flex-col gap-2">
				<div class="flex min-w-0 flex-col gap-2">
					<div
						role="group"
						aria-label="Joints"
						class="flex min-w-0 flex-col"
					>
						{#each jointDegrees ?? [] as degrees, joint (joint)}
							<JogRow
								label={jointLabel(joint)}
								value={degrees}
								formatValue={formatDegrees}
								unit={DEGREES_UNIT}
								step={steps.jointDegrees}
								min={jointLimits.at(joint)?.minDegrees}
								max={jointLimits.at(joint)?.maxDegrees}
								isBusy={isGroupBusy}
								busyDirection={heldJointDirection(joint)}
								describedBy={manualModeDescription}
								onPress={(direction) => {
									pressJoint(joint, direction)
								}}
								onRelease={() => {
									releaseJoint(joint)
								}}
							/>
						{/each}
					</div>
					<div class="flex flex-wrap items-center gap-1.5">
						{@render goalButton('zero', ZERO_LABEL, zeroGoal)}
						{#if armHome.jointDegrees !== undefined}
							{@render goalButton('home', HOME_LABEL, () => armHome.jointDegrees)}
						{/if}
						<button
							type="button"
							class="button button-xs button-outline"
							aria-disabled={jointDegrees === undefined || undefined}
							onclick={setCurrentAsHome}
						>
							Set current as home
						</button>
						<span class="text-subtle-2 text-xs">Press and hold</span>
					</div>
				</div>
				{#if isManualMode}
					<p
						id={manualModeHintId}
						class="text-subtle-1 text-xs"
					>
						{MANUAL_MODE_TEXT}
					</p>
				{/if}
				<StatusLine text={statusText} />
				{#if !isEmbedded}
					<ArmStepsFolder
						{steps}
						fields={['joint']}
					/>
				{/if}
			</div>
		{:else}
			<Section.Text>Joint jogging needs the builtin motion service.</Section.Text>
		{/if}
	</Section.Body>
{/snippet}

{#if isEmbedded}
	{#each sectionErrors.errors as error (errorKey(error))}
		<Section.Error {error} />
	{/each}
	{@render controls()}
{:else}
	<Section
		errorReporter={sectionErrors}
		class="grow flex-col gap-4"
	>
		<Section.Heading>
			Joints
			{#snippet aside()}
				<Section.Errors errors={sectionErrors.errors} />
			{/snippet}
		</Section.Heading>
		{@render controls()}
	</Section>
{/if}
