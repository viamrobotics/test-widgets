<script lang="ts">
	import { Icon, Tooltip } from '@viamrobotics/prime-core'

	import AngleUnitToggle from '$lib/components/angle-unit-toggle.svelte'
	import ErrorDisplay from '$lib/components/error.svelte'
	import { initPortals } from '$lib/portal'
	import Portal from '$lib/Portal.svelte'

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

	initPortals()

	let useRadians = $state(false)
	let controlMode = $state<ControlMode>('jointPositions')

	const isQuickMoveMode = $derived(controlMode === 'quickMove')

	const toggleMode = () => {
		controlMode = isQuickMoveMode ? 'jointPositions' : 'quickMove'
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
				<Portal name="widget-buttons" />
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
			{positions}
			{moveToJointPositions}
			{useRadians}
			{jointLimitsDegrees}
		/>
	{/if}

	<ErrorDisplay {lastError} />
</div>
