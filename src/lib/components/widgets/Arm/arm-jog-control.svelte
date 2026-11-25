<script lang="ts">
	import { Folder, ToggleButtons } from '@viamrobotics/prime-controls'
	import { ArmClient, MotionClient, type RobotClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
		createRobotQuery,
		useResourceStatuses,
		useRobotClient,
	} from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import type { JogDirection } from '$lib/components/jog-target'

	import JogRow from '$lib/components/jog-row.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import StatusLine from '$lib/components/status-line.svelte'

	import { useArmState } from './arm-state.svelte'
	import ArmStepsFolder from './arm-steps-folder.svelte'
	import {
		executeCommand,
		joinTrajectories,
		parsePlanResult,
		planCommand,
		type TrajectoryStep,
	} from './builtin-plan-command'
	import {
		composeJogGoal,
		type JogAxis,
		type JogFrame,
		type JogMotion,
		type JogPose,
		travelAlongAxis,
	} from './jog-pose-goal'
	import { poseGoalMoveArgs } from './motion-jog-request'
	import { canPlanMotion, moveMotionServiceName } from './move-control-mode'
	import { orientationVectorToRollPitchYaw, type RollPitchYawDegrees } from './orientation-vector'
	import { useArmMotionTracking } from './use-arm-motion-tracking.svelte'
	import {
		type HoldPhase,
		type LookaheadDriver,
		SEGMENTS_PER_EXECUTE,
		type SteppingDriver,
		useSegmentedHold,
	} from './use-segmented-hold.svelte'
	import { DEFAULT_JOG_QUEUE_TIMING } from './useJogQueue.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	type JogKind = JogMotion['kind']
	type FailedCall = 'plan' | 'execute' | 'move'

	interface JogRowSpec {
		label: string
		axis: JogAxis
	}

	interface Burst {
		kind: JogKind
		axis: JogAxis
		label: string
		direction: JogDirection
		start: JogPose
		frame: JogFrame
		isStraightLine: boolean
		stepSize: number
		isLookahead: boolean
	}

	interface JogPlan {
		trajectory: TrajectoryStep[]
		frame: JogFrame
		isStraightLine: boolean
	}

	const BUILTIN_MOTION_SERVICE = 'builtin'
	const FRAME_SYSTEM_REFETCH_INTERVAL_MS = 5000
	const MANUAL_MODE_REFETCH_INTERVAL_MS = 1000
	const READOUT_DECIMALS = 2
	const MILLIMETERS = 'mm'
	const DEGREES = '°'
	const VALUE_PLACEHOLDER = '-'
	const POSITION_ROWS: JogRowSpec[] = [
		{ label: 'X', axis: 'x' },
		{ label: 'Y', axis: 'y' },
		{ label: 'Z', axis: 'z' },
	]
	const ORIENTATION_ROWS: JogRowSpec[] = [
		{ label: 'Roll', axis: 'x' },
		{ label: 'Pitch', axis: 'y' },
		{ label: 'Yaw', axis: 'z' },
	]
	const ANGLE_ABOUT_AXIS: Record<JogAxis, keyof RollPitchYawDegrees> = {
		x: 'roll',
		y: 'pitch',
		z: 'yaw',
	}
	const FRAME_ITEMS = [
		{ value: 'world', label: 'World' },
		{ value: 'end-effector', label: 'End effector' },
	] satisfies { value: JogFrame; label: string }[]
	const FRAME_NAMES: Record<JogFrame, string> = { world: 'World', 'end-effector': 'End effector' }
	const DIRECTION_SIGN: Record<JogDirection, number> = { decrease: -1, increase: 1 }
	const DIRECTION_SYMBOL: Record<JogDirection, string> = { decrease: '−', increase: '+' }
	const FAILURE_REASONS: Record<FailedCall, string> = {
		plan: 'planning failed',
		execute: 'the segment failed',
		move: 'the move failed',
	}
	const NO_MOTION_TEXT = 'Jogging needs a motion service that can move this arm.'
	const MANUAL_MODE_TEXT = 'Exit manual mode to move'

	const instanceId = $props.id()
	const manualModeHintId = `${instanceId}-manual-mode`
	const worldReadoutLabelId = `${instanceId}-world-readout`

	const motionServices = useResourceStatuses(() => partID, 'motion')
	const motionServiceNames = $derived(
		motionServices.current
			.map((service) => service.name?.name)
			.filter((name): name is string => name !== undefined)
	)
	const motionServiceName = $derived(moveMotionServiceName(motionServiceNames))
	const isBuiltin = $derived(motionServiceName === BUILTIN_MOTION_SERVICE)

	const robotClient = useRobotClient(() => partID)
	const frameSystemQuery = createRobotQuery(robotClient, 'frameSystemConfig', () => ({
		refetchInterval: FRAME_SYSTEM_REFETCH_INTERVAL_MS,
	}))
	const frameSystem = $derived(frameSystemQuery.data)
	const canMove = $derived(
		frameSystem !== undefined && canPlanMotion(motionServiceNames, frameSystem, resourceName)
	)
	const cannotMove = $derived(
		motionServiceName === undefined || (frameSystem !== undefined && !canMove)
	)

	const motionClient = createResourceClient(
		MotionClient,
		() => partID,
		() => motionServiceName ?? ''
	)
	const armClient = createResourceClient(
		ArmClient,
		() => partID,
		() => resourceName
	)
	const stopMutation = createResourceMutation(armClient, 'stop')

	const propertiesQuery = createResourceQuery(armClient, 'getProperties')
	const supportsManualMode = $derived(propertiesQuery.data?.supportManualMode === true)
	const manualModeQuery = createResourceQuery(armClient, 'getManualMode', () => ({
		refetchInterval: MANUAL_MODE_REFETCH_INTERVAL_MS,
		enabled: supportsManualMode,
	}))
	const isManualMode = $derived(supportsManualMode && manualModeQuery.data === true)

	const {
		motion: motionGuard,
		jogSteps: steps,
		holdCancel,
	} = untrack(() => useArmState(partID, resourceName))

	const hold = useSegmentedHold({
		guard: motionGuard,
		stop: () => stopMutation.mutateAsync([]),
		holdDelayMs: DEFAULT_JOG_QUEUE_TIMING.holdRepeatDelayMs,
		segmentsPerExecute: SEGMENTS_PER_EXECUTE,
	})

	const motionTracking = useArmMotionTracking(armClient, {
		isMovePending: () => hold.phase !== 'idle',
		refetchPosition: () => poseQuery.refetch(),
	})
	const refetchInterval = $derived(motionTracking.refetchInterval)

	const poseQuery = createRobotQuery(
		robotClient,
		'getPose',
		() => [resourceName, 'world', []] satisfies Parameters<RobotClient['getPose']>,
		() => ({ refetchInterval, enabled: canMove })
	)

	const livePose: JogPose | undefined = $derived.by(() => {
		const pose = poseQuery.data?.pose
		if (pose === undefined) {
			return undefined
		}
		const { x, y, z, oX, oY, oZ, theta } = pose
		return { x, y, z, oX, oY, oZ, theta }
	})
	const rollPitchYaw = $derived(
		livePose === undefined ? undefined : orientationVectorToRollPitchYaw(livePose)
	)

	const holdFailure = {
		get error() {
			return hold.failure ?? null
		},
	}

	const sectionErrors = useSectionErrors(() => ({
		queries: [frameSystemQuery, poseQuery, propertiesQuery, manualModeQuery],
		mutations: [stopMutation, holdFailure],
	}))

	let frame = $state<JogFrame>('world')
	let burst = $state.raw<Burst>()
	let failedCall = $state<FailedCall>()

	const getFrame = () => frame
	const setFrame = (next: string) => {
		frame = next === 'end-effector' ? 'end-effector' : 'world'
	}

	const stepUnit = (kind: JogKind) => (kind === 'translate' ? MILLIMETERS : DEGREES)
	const stepSizeFor = (kind: JogKind) =>
		kind === 'translate' ? steps.positionMillimeters : steps.orientationDegrees
	const formatReadout = (value: number) => value.toFixed(READOUT_DECIMALS)

	const motionFor = (jog: Burst, stepNumber: number): JogMotion => {
		const amount = stepNumber * jog.stepSize * DIRECTION_SIGN[jog.direction]
		if (jog.kind === 'translate') {
			return { kind: 'translate', axis: jog.axis, millimeters: amount }
		}
		return { kind: 'rotate', axis: jog.axis, degrees: amount }
	}

	const moveArgsFor = (jog: Burst, stepNumber: number) =>
		poseGoalMoveArgs({
			armName: resourceName,
			goal: composeJogGoal(jog.start, motionFor(jog, stepNumber), jog.frame),
			isStraightLine: jog.isStraightLine,
		})

	// Records which call failed for the status line. A rejection after the engine's own abort is not a failure.
	async function recordingFailure<TResult>(
		call: FailedCall,
		signal: AbortSignal,
		send: () => Promise<TResult>
	): Promise<TResult> {
		try {
			return await send()
		} catch (error) {
			if (!signal.aborted) {
				failedCall = call
			}
			throw error
		}
	}

	const steppingDriver = (motion: MotionClient, jog: Burst): SteppingDriver => ({
		kind: 'stepping',
		moveStep: (stepNumber, signal) =>
			recordingFailure('move', signal, async () => {
				const [destination, componentName, worldState, constraints, extra] = moveArgsFor(
					jog,
					stepNumber
				)
				await motion.move(destination, componentName, worldState, constraints, extra, {
					...motion.callOptions,
					signal,
				})
			}),
	})

	const lookaheadDriver = (motion: MotionClient, jog: Burst): LookaheadDriver<JogPlan> => ({
		kind: 'lookahead',
		planStep: (stepNumber, previous, signal) =>
			recordingFailure('plan', signal, async () => {
				const reply = await motion.doCommand(
					planCommand(moveArgsFor(jog, stepNumber), previous?.trajectory.at(-1)),
					{ ...motion.callOptions, signal }
				)
				return {
					trajectory: parsePlanResult(reply).trajectory,
					frame: jog.frame,
					isStraightLine: jog.isStraightLine,
				}
			}),
		joinPlans: (plans) => ({
			trajectory: joinTrajectories(plans.map((plan) => plan.trajectory)),
			frame: jog.frame,
			isStraightLine: jog.isStraightLine,
		}),
		executePlan: (plan, signal) =>
			recordingFailure('execute', signal, async () => {
				await motion.doCommand(executeCommand(plan.trajectory), {
					...motion.callOptions,
					signal,
				})
			}),
		isPlanCurrent: (plan) => plan.frame === frame && plan.isStraightLine === steps.isStraightLine,
	})

	const startJog = (kind: JogKind, row: JogRowSpec, direction: JogDirection) => {
		const motion = motionClient.current
		const start = livePose
		if (motion === undefined || start === undefined || isManualMode) {
			return
		}
		const jog: Burst = {
			kind,
			axis: row.axis,
			label: row.label,
			direction,
			start,
			frame,
			isStraightLine: steps.isStraightLine,
			stepSize: stepSizeFor(kind),
			isLookahead: isBuiltin,
		}
		const driver = jog.isLookahead ? lookaheadDriver(motion, jog) : steppingDriver(motion, jog)
		const previousFailedCall = failedCall
		failedCall = undefined
		if (hold.press(driver)) {
			burst = jog
			return
		}
		failedCall = previousFailedCall
	}

	const endJog = () => {
		hold.release()
	}

	const describeMoving = (jog: Burst, phase: HoldPhase) => {
		const sign = DIRECTION_SYMBOL[jog.direction]
		if (!jog.isLookahead) {
			const separator = jog.kind === 'translate' ? ' ' : ''
			return `Stepping ${jog.label} ${sign}${jog.stepSize}${separator}${stepUnit(jog.kind)}`
		}
		if (phase === 'moving-next-planned') {
			return `Moving ${jog.label} ${sign}, next segment planned`
		}
		return `Moving ${jog.label} ${sign}`
	}

	const describeFailure = (jog: Burst) => {
		const reason = FAILURE_REASONS[failedCall ?? 'move']
		return `Stopped ${jog.label} ${DIRECTION_SYMBOL[jog.direction]}, ${reason}`
	}

	const statusText = $derived.by(() => {
		if (burst === undefined) {
			return ''
		}
		if (hold.phase !== 'idle') {
			return describeMoving(burst, hold.phase)
		}
		if (hold.failure !== undefined) {
			return describeFailure(burst)
		}
		return ''
	})

	const isStepperBlocked = $derived(motionGuard.isBusy || isManualMode)

	const heldDirection = (kind: JogKind, row: JogRowSpec): JogDirection | undefined => {
		if (burst === undefined || hold.phase === 'idle') {
			return undefined
		}
		if (burst.kind !== kind || burst.axis !== row.axis) {
			return undefined
		}
		return burst.direction
	}

	// The end effector's position in its own frame is always zero, so its rows count travel during a hold.
	const endEffectorTravel = (axis: JogAxis): number | undefined => {
		if (livePose === undefined) {
			return undefined
		}
		if (burst === undefined || burst.frame !== 'end-effector' || hold.phase === 'idle') {
			return 0
		}
		return travelAlongAxis(burst.start, livePose, axis)
	}

	const positionValue = (axis: JogAxis): number | undefined => {
		if (frame === 'world') {
			return livePose?.[axis]
		}
		return endEffectorTravel(axis)
	}

	const orientationValue = (axis: JogAxis) => rollPitchYaw?.[ANGLE_ABOUT_AXIS[axis]]

	const worldReadout = (axis: JogAxis) => {
		const value = livePose?.[axis]
		return value === undefined ? VALUE_PLACEHOLDER : formatReadout(value)
	}

	const manualModeDescription = $derived(isManualMode ? manualModeHintId : undefined)

	$effect(() => {
		if (isManualMode) {
			untrack(() => {
				hold.cancel()
			})
		}
	})

	$effect(() => () => {
		hold.release()
	})

	// Stop raises it, from wherever on the page it renders.
	$effect(() =>
		holdCancel.subscribe(() => {
			hold.cancel()
		})
	)
</script>

{#snippet jogRows(
	kind: JogKind,
	rows: JogRowSpec[],
	value: (row: JogRowSpec) => number | undefined
)}
	{#each rows as row (row.axis)}
		<JogRow
			label={row.label}
			value={value(row)}
			formatValue={formatReadout}
			unit={stepUnit(kind)}
			step={stepSizeFor(kind)}
			min={undefined}
			max={undefined}
			isBusy={isStepperBlocked}
			busyDirection={heldDirection(kind, row)}
			describedBy={manualModeDescription}
			onPress={(direction) => {
				startJog(kind, row, direction)
			}}
			onRelease={endJog}
		/>
	{/each}
{/snippet}

<div class="@container flex min-w-0 grow flex-col">
	<Section
		errorReporter={sectionErrors}
		class="grow flex-col gap-4"
	>
		<Section.Heading>
			Jog
			{#snippet aside()}
				<Section.Errors errors={sectionErrors.errors} />
			{/snippet}
		</Section.Heading>
		<Section.Body isLoading={sectionErrors.isLoading}>
			{#if canMove}
				<div class="flex w-full min-w-0 flex-col gap-2">
					<ToggleButtons
						label="Frame"
						items={FRAME_ITEMS}
						bind:value={getFrame, setFrame}
					/>
					{#if frame === 'end-effector'}
						<div
							role="group"
							aria-labelledby={worldReadoutLabelId}
							class="flex flex-col gap-1"
						>
							<span
								id={worldReadoutLabelId}
								class="text-subtle-1 text-xs"
							>
								Position in world
							</span>
							<dl class="font-roboto-mono grid grid-cols-3 gap-2 text-xs">
								{#each POSITION_ROWS as row (row.axis)}
									<div class="flex items-baseline gap-1">
										<dt class="text-subtle-1">{row.label}</dt>
										<dd class="text-default tabular-nums">
											{worldReadout(row.axis)}<span class="text-subtle-2"> {MILLIMETERS}</span>
										</dd>
									</div>
								{/each}
							</dl>
						</div>
					{/if}
					<div
						role="group"
						aria-label="{FRAME_NAMES[frame]} position"
						class="flex min-w-0 flex-col"
					>
						{@render jogRows('translate', POSITION_ROWS, (row) => positionValue(row.axis))}
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
					<Folder
						title="Orientation"
						open={false}
					>
						<div
							role="group"
							aria-label="{FRAME_NAMES[frame]} orientation"
							class="flex min-w-0 flex-col"
						>
							{@render jogRows('rotate', ORIENTATION_ROWS, (row) => orientationValue(row.axis))}
						</div>
					</Folder>
				</div>
			{:else if cannotMove}
				<p class="text-subtle-1 text-xs">{NO_MOTION_TEXT}</p>
			{/if}
		</Section.Body>
		{#if canMove}
			<ArmStepsFolder
				{steps}
				fields={['position', 'orientation', 'straight-line']}
			/>
		{/if}
	</Section>
</div>
