<script lang="ts">
	import { Icon, Tooltip } from '@viamrobotics/prime-core'

	import AngleUnitToggle from '$lib/components/angle-unit-toggle.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import ErrorDisplay from '$lib/components/error.svelte'
	import PasteButton from '$lib/components/paste-button.svelte'
	import { degreesToRadians, formatNumeric, radiansToDegrees } from '$lib/format'

	import JointPositionEditor from './joint-position-editor.svelte'
	import { type JointLimit } from './joint-position-limits'
	import JointPositionQuickMove from './joint-position-quick-move.svelte'

	type ControlMode = 'jointPositions' | 'quickMove'

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
	let desiredPositions = $state([...positions])
	let useRadians = $state(false)
	let controlMode = $state<ControlMode>('jointPositions')

	const isQuickMoveMode = $derived(controlMode === 'quickMove')

	const getSliderMin = (index: number): number => jointLimitsDegrees[index]?.minDegrees ?? -180
	const getSliderMax = (index: number): number => jointLimitsDegrees[index]?.maxDegrees ?? 180

	const toDisplayAngle = (degrees: number) => (useRadians ? degreesToRadians(degrees) : degrees)

	const displayPositions = $derived(desiredPositions.map((degrees) => toDisplayAngle(degrees)))
	const copyData = $derived(`[${displayPositions.map((v) => formatNumeric(v)).join(', ')}]`)

	const toggleMode = () => {
		controlMode = isQuickMoveMode ? 'jointPositions' : 'quickMove'
	}

	const handlePaste = (data: string): boolean => {
		try {
			const parsed = JSON.parse(data) as number[]
			desiredPositions = parsed.map((pos, i) => {
				const degrees = useRadians ? radiansToDegrees(pos) : pos
				return Math.min(Math.max(degrees, getSliderMin(i)), getSliderMax(i))
			})
		} catch {
			return false
		}
		return true
	}
</script>

<div class="flex min-w-0 flex-col gap-4">
	<div class="flex items-center justify-between">
		<span class="flex flex-row items-center gap-1 text-sm">
			Joint Positions
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>
				<span slot="description">
					Joint position limits are based solely on the arm kinematics and do not take into account
					motion service limit overrides.
				</span>
			</Tooltip>
		</span>
		<div class="flex items-center gap-1">
			<div class="flex gap-1">
				{#if !isQuickMoveMode}
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
			<Tooltip>
				<button
					onclick={toggleMode}
					aria-label={isQuickMoveMode ? 'Exit quick move mode' : 'Enter quick move mode'}
					class={[
						'hover:border-medium hover:bg-medium active:bg-gray-2 rounded p-0.5',
						isQuickMoveMode ? 'text-amber-600' : 'text-gray-6',
					]}
				>
					<Icon name="lightning-bolt-outline" />
				</button>
				<span slot="description">
					{isQuickMoveMode ? 'Exit quick move mode' : 'Enter quick move mode'}
				</span>
			</Tooltip>
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
