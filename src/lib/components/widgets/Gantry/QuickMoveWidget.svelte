<script lang="ts">
	import { NumberField, Select } from '@viamrobotics/prime-controls'
	import { GantryClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'
	import { type JogDirection, jogTarget } from '#lib/components/jog-target.js'
	import JogRow from '#lib/components/JogRow.svelte'
	import { Section, useSectionErrors } from '#lib/components/Section/index.js'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { untrack } from 'svelte'

	import { useGantryState } from './gantry-state.svelte'

	interface Props {
		partID: string
		resourceName: string
		/**
		 * Names for the axes in `GetLengths` order, labelling the jog rows and the status line. From
		 * a multi-axis gantry's `subaxes_list` config key. Used only once `GetLengths` has answered
		 * and the list is as long as its answer. Otherwise the rows read "Axis 0", "Axis 1", and so on.
		 */
		axisNames?: string[]
		/**
		 * One speed per axis in mm/s, seeding the Speed field with the smallest finite entry above 0.
		 * From each single-axis `gantry_mm_per_sec` config key. The seed is 50 when no entry
		 * qualifies. The field follows this prop until the user edits it.
		 */
		defaultSpeedsMmPerSec?: number[]
	}

	const { partID, resourceName, axisNames, defaultSpeedsMmPerSec }: Props = $props()

	interface Hold {
		axis: number
		direction: JogDirection
	}

	interface StepInFlight {
		hold: Hold
		target: number
		step: number
	}

	const POLL_INTERVAL_MS = 500
	const AXIS_START_MM = 0
	const STEP_OPTIONS_MM = [1, 5, 10, 50, 100]
	const DEFAULT_STEP_MM = 10
	const DEFAULT_SPEED_MM_PER_SEC = 50
	const MINIMUM_SPEED_MM_PER_SEC = 0
	const READOUT_DECIMALS = 2
	const UNIT = 'mm'
	const STEP_ITEMS = STEP_OPTIONS_MM.map((step) => ({ value: String(step), label: `${step} mm` }))
	const STEPPING_HINT =
		'Press to move one step. Hold to keep stepping: the gantry moves one step at a time, and when you let go it stops after the step it is on.'
	const DIRECTION_SIGN: Record<JogDirection, string> = { decrease: '−', increase: '+' }

	const client = createResourceClient(
		GantryClient,
		() => partID,
		() => resourceName
	)

	const positionQuery = createResourceQuery(client, 'getPosition', {
		refetchInterval: POLL_INTERVAL_MS,
	})
	const lengthsQuery = createResourceQuery(client, 'getLengths', { refetchInterval: false })
	const moveMutation = createResourceMutation(client, 'moveToPosition')

	const sectionErrors = useSectionErrors(() => ({
		queries: [positionQuery, lengthsQuery],
		mutations: [moveMutation],
	}))

	const { motion, holdCancel, homing } = untrack(() => useGantryState(partID, resourceName))

	let stepMm = $state(DEFAULT_STEP_MM)
	let isSpeedEdited = $state(false)
	let editedSpeed = $state<number | undefined>()
	let hold = $state.raw<Hold | undefined>()
	let stepInFlight = $state.raw<StepInFlight | undefined>()

	const getStep = () => String(stepMm)
	const selectStep = (next: string | undefined) => {
		const picked = STEP_OPTIONS_MM.find((step) => String(step) === next)
		if (picked !== undefined) stepMm = picked
	}

	const seedSpeed: number = $derived.by(() => {
		const usable = (defaultSpeedsMmPerSec ?? []).filter(
			(candidate) => Number.isFinite(candidate) && candidate > MINIMUM_SPEED_MM_PER_SEC
		)
		return usable.length === 0 ? DEFAULT_SPEED_MM_PER_SEC : Math.min(...usable)
	})
	const speed: number | undefined = $derived(isSpeedEdited ? editedSpeed : seedSpeed)
	const getSpeed = () => speed
	const setSpeed = (next: number | undefined) => {
		if (next === speed) return
		isSpeedEdited = true
		editedSpeed = next
	}

	const validSpeed: number | undefined = $derived(
		speed !== undefined && Number.isFinite(speed) && speed > MINIMUM_SPEED_MM_PER_SEC
			? speed
			: undefined
	)

	const usedAxisNames: string[] | undefined = $derived(
		axisNames !== undefined && axisNames.length === lengthsQuery.data?.length
			? axisNames
			: undefined
	)
	const axisLabel = (axis: number) => usedAxisNames?.[axis] ?? `Axis ${axis}`
	const formatMm = (value: number) => value.toFixed(READOUT_DECIMALS)

	// GetLengths answers 0 for an axis whose length the gantry does not know.
	const isReportedLength = (length: number | undefined): length is number =>
		length !== undefined && length > 0

	// An axis with no reported length is not clamped above.
	const axisMax = (axis: number) => {
		const length = lengthsQuery.data?.[axis]
		return isReportedLength(length) ? length : undefined
	}

	const describeStep = (step: StepInFlight) => {
		const label = axisLabel(step.hold.axis)
		if (hold === step.hold) {
			return `Stepping ${label} ${DIRECTION_SIGN[step.hold.direction]}${step.step} ${UNIT}. Let go to stop after this step`
		}
		return `Moving ${label} to ${formatMm(step.target)} ${UNIT}`
	}

	// While Home holds the group, the line reads Home's status, so a dropped press explains itself.
	const statusText = $derived(
		stepInFlight === undefined ? homing.busyStatus : describeStep(stepInFlight)
	)

	const finishHold = (stepHold: Hold) => {
		if (hold === stepHold) hold = undefined
	}

	// Each step starts from the last step's target, never a fresh read, so a hold's steps add up.
	const stepFrom = async (stepHold: Hold, start: number[]): Promise<void> => {
		const step = stepMm
		const target = jogTarget({
			start: start[stepHold.axis],
			direction: stepHold.direction,
			step,
			min: AXIS_START_MM,
			max: axisMax(stepHold.axis),
		})
		const speedPerAxis = validSpeed
		if (target === undefined || speedPerAxis === undefined) {
			finishHold(stepHold)
			return
		}
		const goal = start.map((position, axis) => (axis === stepHold.axis ? target : position))
		const outcome = await motion.run(() => {
			stepInFlight = { hold: stepHold, target, step }
			return moveMutation.mutateAsync([goal, goal.map(() => speedPerAxis)])
		})
		if (stepInFlight?.hold === stepHold) stepInFlight = undefined
		if (outcome !== 'succeeded' || hold !== stepHold) {
			finishHold(stepHold)
			return
		}
		await stepFrom(stepHold, goal)
	}

	const startHold = (axis: number, direction: JogDirection) => {
		const positions = positionQuery.data
		if (positions === undefined) return
		const nextHold: Hold = { axis, direction }
		hold = nextHold
		void stepFrom(nextHold, positions)
	}

	// Ends any hold, so no further step goes out. The step in flight still finishes.
	const endHold = () => {
		hold = undefined
	}

	// Stop raises it, from wherever on the page it renders.
	$effect(() => holdCancel.subscribe(endHold))
</script>

<!-- The container sits outside the section padding, so a 672 px pane reaches `@2xl`. -->
<div class="@container flex min-w-0 grow flex-col">
	<Section
		errorReporter={sectionErrors}
		class="grow flex-col gap-4"
	>
		<Section.Heading>
			Quick move
			{#snippet aside()}
				<Section.Errors errors={sectionErrors.errors} />
			{/snippet}
		</Section.Heading>
		<Section.Body isLoading={sectionErrors.isLoading}>
			<div class="flex w-full min-w-0 flex-col gap-2">
				<div class="grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 @2xl:grid-cols-2">
					<div
						role="group"
						aria-label="Axes"
						class="flex min-w-0 flex-col"
					>
						{#each positionQuery.data ?? [] as position, axis (axis)}
							<JogRow
								label={axisLabel(axis)}
								value={position}
								formatValue={formatMm}
								unit={UNIT}
								step={stepMm}
								min={AXIS_START_MM}
								max={axisMax(axis)}
								isBusy={motion.isBusy}
								onPress={(direction) => {
									startHold(axis, direction)
								}}
								onRelease={endHold}
							/>
						{/each}
					</div>
					<div class="flex min-w-0 flex-col gap-1">
						<div class="flex items-center gap-2">
							<span
								aria-hidden="true"
								class="text-subtle-1 w-12 shrink-0 text-xs"
							>
								Step
							</span>
							<Select
								items={STEP_ITEMS}
								bind:value={getStep, selectStep}
								aria-label="Step"
								hint={STEPPING_HINT}
							/>
						</div>
						<NumberField
							label="Speed"
							suffix="mm/s"
							min={MINIMUM_SPEED_MM_PER_SEC}
							state={validSpeed === undefined ? 'error' : undefined}
							{...emptyOnClear(() => setSpeed(undefined))}
							bind:value={getSpeed, setSpeed}
						/>
					</div>
				</div>
				<StatusLine text={statusText} />
			</div>
		</Section.Body>
	</Section>
</div>
