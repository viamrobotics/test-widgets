<script lang="ts">
	import { Icon, ToggleButtons, Tooltip } from '@viamrobotics/prime-core'

	import AngleUnitToggle from '$lib/components/angle-unit-toggle.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import ErrorDisplay from '$lib/components/error.svelte'
	import PasteButton from '$lib/components/paste-button.svelte'
	import { degreesToRadians, formatNumeric, radiansToDegrees } from '$lib/format'

	import JointPositionEditor from './joint-position-editor.svelte'
	import JointPositionJogging from './joint-position-jogging.svelte'
	import { type JointLimit } from './joint-position-limits'
	import { useEditedTargets } from './use-edited-targets.svelte'

	type ControlMode = 'Jogging' | 'Joint Positions'

	const CONTROL_MODES: ControlMode[] = ['Jogging', 'Joint Positions']

	// Tight enough to catch a real move, loose enough to ignore encoder noise.
	const JOINT_DRIFT_DEGREES = 0.5

	interface Props {
		positions: number[]
		/** Sends the move. Rejects when it fails. */
		moveToJointPositions: (jointPositions: number[]) => Promise<void>
		lastError: Error | null
		jointLimitsDegrees: JointLimit[]
		isMoving?: boolean
	}

	const {
		positions,
		moveToJointPositions,
		lastError,
		jointLimitsDegrees,
		isMoving = false,
	}: Props = $props()

	const targets = useEditedTargets<number>(
		(index) => positions[index] ?? 0,
		() => JOINT_DRIFT_DEGREES
	)
	const desiredPositions = $derived(positions.map((_, index) => targets.target(index))) // in degrees
	let useRadians = $state(false)
	let controlMode = $state<ControlMode>('Jogging')

	const isJoggingMode = $derived(controlMode === 'Jogging')

	const getJointMin = (index: number): number => jointLimitsDegrees[index]?.minDegrees ?? -180
	const getJointMax = (index: number): number => jointLimitsDegrees[index]?.maxDegrees ?? 180

	const toDisplayAngle = (degrees: number) => (useRadians ? degreesToRadians(degrees) : degrees)

	const displayPositions = $derived(desiredPositions.map((degrees) => toDisplayAngle(degrees)))
	const copyData = $derived(`[${displayPositions.map((v) => formatNumeric(v)).join(', ')}]`)

	const handleModeChange = ({ detail }: CustomEvent<string>) => {
		const nextMode = CONTROL_MODES.find((mode) => mode === detail)
		if (nextMode) {
			controlMode = nextMode
		}
	}

	const handlePaste = (data: string): boolean => {
		try {
			const parsed = JSON.parse(data) as number[]
			for (const [index, pos] of parsed.slice(0, positions.length).entries()) {
				const degrees = useRadians ? radiansToDegrees(pos) : pos
				targets.edit(index, Math.min(Math.max(degrees, getJointMin(index)), getJointMax(index)))
			}
		} catch {
			return false
		}
		return true
	}
</script>

<div class="flex min-w-0 flex-col gap-4">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<ToggleButtons
			role="group"
			aria-label="Control mode"
			options={CONTROL_MODES}
			selected={controlMode}
			on:input={handleModeChange}
		/>
		<div class="flex items-center gap-1">
			{#if !isJoggingMode}
				<Tooltip>
					<Icon
						name="information-outline"
						cx="text-gray-6"
					/>
					<span slot="description">
						Joint position limits are based solely on the arm kinematics and do not take into
						account motion service limit overrides.
					</span>
				</Tooltip>
				<CopyButton data={copyData} />
				<PasteButton onPaste={handlePaste} />
			{/if}
			<AngleUnitToggle
				{useRadians}
				onToggle={() => {
					useRadians = !useRadians
				}}
			/>
		</div>
	</div>

	{#if isJoggingMode}
		<JointPositionJogging
			{positions}
			{moveToJointPositions}
			{jointLimitsDegrees}
			{useRadians}
			{isMoving}
		/>
	{:else}
		<JointPositionEditor
			{targets}
			{positions}
			{moveToJointPositions}
			{useRadians}
			{jointLimitsDegrees}
			{isMoving}
		/>
	{/if}

	<ErrorDisplay {lastError} />
</div>
