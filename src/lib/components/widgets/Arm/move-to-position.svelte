<script
	lang="ts"
	module
>
	import type { Pose } from '@viamrobotics/sdk'

	type PoseKey = keyof Pose

	const POSE_KEYS: PoseKey[] = ['x', 'y', 'z', 'oX', 'oY', 'oZ', 'theta']

	// Tight enough to catch a real move, loose enough to ignore encoder noise. Theta is in degrees.
	const DRIFT_THRESHOLDS: Record<PoseKey, number> = {
		x: 1,
		y: 1,
		z: 1,
		oX: 0.01,
		oY: 0.01,
		oZ: 0.01,
		theta: 0.5,
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte'

	import { mdiInformationOutline, mdiPlayCircleOutline } from '@mdi/js'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'

	import PoseEditor from '$lib/components/pose-editor.svelte'

	import { useEditedTargets } from './use-edited-targets.svelte'

	interface Props {
		endPosition: Pose
		moveToPosition: (position: Pose) => void
		isMoving?: boolean
		description?: Snippet
	}

	const {
		endPosition,
		moveToPosition,
		isMoving = false,
		description: customDescription,
	}: Props = $props()

	const targets = useEditedTargets<PoseKey>(
		(key) => endPosition[key],
		(key) => DRIFT_THRESHOLDS[key]
	)

	const desiredPosition = $derived<Pose>({
		x: targets.target('x'),
		y: targets.target('y'),
		z: targets.target('z'),
		oX: targets.target('oX'),
		oY: targets.target('oY'),
		oZ: targets.target('oZ'),
		theta: targets.target('theta'),
	})

	const handlePoseChange = (next: Pose) => {
		for (const key of POSE_KEYS) {
			if (next[key] !== desiredPosition[key]) {
				targets.edit(key, next[key])
			}
		}
	}

	const quickSetId = $props.id()

	const resetToZero = () => {
		for (const key of POSE_KEYS) {
			targets.edit(key, 0)
		}
	}
</script>

{#snippet poseDescription()}
	Pose is with respect to the arm origin and does not take into account the motion service or frame
	system.
{/snippet}

<div class="flex min-w-0 flex-col gap-3">
	<PoseEditor
		pose={desiredPosition}
		onPoseChange={handlePoseChange}
		fieldStatus={(key) => ({
			current: endPosition[key],
			isEdited: targets.isEdited(key),
			drift: targets.drift(key),
			isMoving,
		})}
		onFieldReset={(key) => {
			targets.reset(key)
		}}
		description={customDescription ?? poseDescription}
	>
		{#snippet heading()}Pose Values{/snippet}
	</PoseEditor>

	<div class="flex flex-col gap-1">
		<div class="flex items-center gap-1">
			<span
				id={quickSetId}
				class="text-subtle-1 text-xs"
			>
				Quick set
			</span>
			<Tooltip>
				<Tooltip.Trigger class="flex shrink-0">
					<button
						type="button"
						aria-label="About Quick set"
						class="text-subtle-2 focus-ring hover:text-default flex min-h-6 min-w-6 items-center justify-center rounded-sm"
					>
						<Icon
							icon={mdiInformationOutline}
							size="sm"
						/>
					</button>
				</Tooltip.Trigger>
				<Tooltip.Content>Will update the pose values but will not execute</Tooltip.Content>
			</Tooltip>
		</div>
		<div
			role="group"
			aria-labelledby={quickSetId}
			class="flex flex-wrap gap-2"
		>
			<button
				type="button"
				class="button button-xs"
				onclick={resetToZero}
			>
				Zero
			</button>
			<button
				type="button"
				class="button button-xs"
				onclick={() => {
					targets.resetAll()
				}}
			>
				Current position
			</button>
		</div>
	</div>
	<div class="mt-auto flex items-center gap-2">
		<button
			type="button"
			class="button button-dark button-compact"
			disabled={isMoving}
			onclick={() => moveToPosition(desiredPosition)}
		>
			<Icon
				icon={mdiPlayCircleOutline}
				size="sm"
			/>
			Execute
		</button>
		<span role="status">
			{#if isMoving}
				<span class="badge badge-success">Arm is moving</span>
			{/if}
		</span>
	</div>
</div>
