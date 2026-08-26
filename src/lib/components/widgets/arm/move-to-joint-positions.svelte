<script lang="ts">
	import { Icon, ToggleButtons, Tooltip } from '@viamrobotics/prime-core'

	import AngleUnitToggle from '$lib/components/angle-unit-toggle.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import ErrorDisplay from '$lib/components/error.svelte'
	import PasteButton from '$lib/components/paste-button.svelte'
	import { degreesToRadians, formatNumeric, radiansToDegrees } from '$lib/format'

	import JointPositionEditor from './joint-position-editor.svelte'
	import { type JointLimit } from './joint-position-limits'
	import JointPositionQuickMove from './joint-position-quick-move.svelte'

	type ControlMode = 'Joint Positions' | 'Quick Move'

	const CONTROL_MODES: ControlMode[] = ['Joint Positions', 'Quick Move']

	interface Props {
		positions: number[]
		moveToJointPositions: (jointPositions: number[]) => void
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

	// svelte-ignore state_referenced_locally
	let desiredPositions = $state([...positions]) // in degrees
	let useRadians = $state(false)
	let controlMode = $state<ControlMode>('Joint Positions')

	const isQuickMoveMode = $derived(controlMode === 'Quick Move')

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
			desiredPositions = parsed.map((pos, i) => {
				const degrees = useRadians ? radiansToDegrees(pos) : pos
				return Math.min(Math.max(degrees, getJointMin(i)), getJointMax(i))
			})
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
			{#if !isQuickMoveMode}
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

	{#if isQuickMoveMode}
		<JointPositionQuickMove
			{positions}
			{moveToJointPositions}
			{useRadians}
			{isMoving}
		/>
	{:else}
		<JointPositionEditor
			bind:desiredPositions
			{positions}
			{moveToJointPositions}
			{useRadians}
			{jointLimitsDegrees}
		/>
	{/if}

	<ErrorDisplay {lastError} />
</div>
