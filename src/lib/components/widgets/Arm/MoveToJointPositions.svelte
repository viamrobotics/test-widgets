<script lang="ts">
	import { mdiInformationOutline } from '@mdi/js'
	import { ToggleButtons } from '@viamrobotics/prime-controls'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'
	import AngleUnitToggle from '#lib/components/AngleUnitToggle.svelte'
	import CopyButton from '#lib/components/CopyButton.svelte'
	import PasteButton from '#lib/components/PasteButton.svelte'
	import { degreesToRadians, formatNumeric, radiansToDegrees } from '#lib/format.js'

	import { type JointLimit } from './joint-position-limits'
	import JointPositionEditor from './JointPositionEditor.svelte'
	import JointPositionJogging from './JointPositionJogging.svelte'
	import { useEditedTargets } from './use-edited-targets.svelte'

	type ControlMode = 'Jogging' | 'Joint Positions'

	const CONTROL_MODES: ControlMode[] = ['Jogging', 'Joint Positions']
	const CONTROL_MODE_ITEMS = CONTROL_MODES.map((mode) => ({ value: mode, label: mode }))

	// Tight enough to catch a real move, loose enough to ignore encoder noise.
	const JOINT_DRIFT_DEGREES = 0.5

	interface Props {
		positions: number[]
		/** Sends the move. Rejects when it fails. */
		moveToJointPositions: (jointPositions: number[]) => Promise<void>
		jointLimitsDegrees: JointLimit[]
		isMoving?: boolean
	}

	const { positions, moveToJointPositions, jointLimitsDegrees, isMoving = false }: Props = $props()

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

	const selectMode = (next: string | undefined) => {
		const nextMode = CONTROL_MODES.find((mode) => mode === next)
		if (nextMode) {
			controlMode = nextMode
		}
	}

	const isNumberList = (data: unknown): data is number[] =>
		Array.isArray(data) && data.every((entry) => typeof entry === 'number')

	const handlePaste = (data: string): boolean => {
		let parsed: unknown
		try {
			parsed = JSON.parse(data)
		} catch {
			return false
		}
		if (!isNumberList(parsed)) return false

		for (const [index, pos] of parsed.slice(0, positions.length).entries()) {
			const degrees = useRadians ? radiansToDegrees(pos) : pos
			targets.edit(index, Math.min(Math.max(degrees, getJointMin(index)), getJointMax(index)))
		}
		return true
	}
</script>

<div class="flex min-w-0 flex-col gap-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<ToggleButtons
			aria-label="Control mode"
			items={CONTROL_MODE_ITEMS}
			bind:value={() => controlMode, selectMode}
		/>
		<div class="flex items-center gap-1">
			{#if !isJoggingMode}
				<Tooltip>
					<Tooltip.Trigger>
						<button
							type="button"
							class="icon-button size-6"
							aria-label="About joint position limits"
						>
							<Icon
								icon={mdiInformationOutline}
								size="sm"
							/>
						</button>
					</Tooltip.Trigger>
					<Tooltip.Content class="max-w-72">
						Joint position limits are based solely on the arm kinematics and do not take into
						account motion service limit overrides.
					</Tooltip.Content>
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
</div>
