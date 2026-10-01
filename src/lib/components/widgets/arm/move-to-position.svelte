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

	import { Button, Icon, Tooltip } from '@viamrobotics/prime-core'

	import PoseEditor from '$lib/components/pose-editor.svelte'
	import StatusPill from '$lib/components/status-pill.svelte'

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

<div class="flex min-w-0 flex-col gap-4">
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

	<div class="mb-2 flex flex-col gap-2">
		<span class="flex flex-row gap-2">
			<h4 class="text-xs font-semibold">Quick set</h4>
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>

				<span slot="description"> Will update the pose values but will not execute </span>
			</Tooltip>
		</span>
		<div class="flex flex-col gap-2 sm:flex-row">
			<Button onclick={resetToZero}>Zero</Button>
			<Button
				onclick={() => {
					targets.resetAll()
				}}
			>
				Current position
			</Button>
		</div>
	</div>
	<div class="mt-auto flex items-center gap-2">
		<Button
			class="w-fit"
			icon="play-circle-outline"
			variant="dark"
			disabled={isMoving}
			onclick={() => moveToPosition(desiredPosition)}
		>
			Execute
		</Button>
		<span role="status">
			{#if isMoving}
				<StatusPill
					isActive
					activeText="Arm is moving"
				/>
			{/if}
		</span>
	</div>
</div>
