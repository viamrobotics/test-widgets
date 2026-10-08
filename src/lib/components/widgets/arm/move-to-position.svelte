<script lang="ts">
	import type { Pose } from '@viamrobotics/sdk'
	import type { Snippet } from 'svelte'

	import { Button, Icon, Tooltip } from '@viamrobotics/prime-core'

	import type { PoseStatusMessage } from '$lib/components/pose-editor/pose-field-status'

	import ErrorDisplay from '$lib/components/error.svelte'
	import PoseEditor from '$lib/components/pose-editor/pose-editor.svelte'
	import StatusPill from '$lib/components/status-pill.svelte'
	import {
		isUnitOrientationVector,
		normalizeOrientationVector,
	} from '$lib/normalize-orientation-vector'

	import { DRIFT_THRESHOLDS, POSE_KEYS, type PoseKey } from './pose'
	import { useEditedTargets } from './use-edited-targets.svelte'

	interface Props {
		endPosition: Pose
		lastError: Error | null
		description: Snippet
		isMoving?: boolean
		moveToPosition: (position: Pose) => void
	}

	const { endPosition, moveToPosition, lastError, description, isMoving = false }: Props = $props()

	const targets = useEditedTargets<PoseKey>(
		(key) => endPosition[key],
		(key) => DRIFT_THRESHOLDS[key]
	)

	const pose = $derived<Pose>({
		x: targets.target('x'),
		y: targets.target('y'),
		z: targets.target('z'),
		oX: targets.target('oX'),
		oY: targets.target('oY'),
		oZ: targets.target('oZ'),
		theta: targets.target('theta'),
	})

	const onPoseChange = (next: Pose) => {
		for (const key of POSE_KEYS) {
			if (next[key] !== pose[key]) {
				targets.edit(key, next[key])
			}
		}
	}

	const fieldStatus = (key: PoseKey) => ({
		current: endPosition[key],
		isEdited: targets.isEdited(key),
		drift: targets.drift(key),
		baseline: targets.baseline(key),
		isMoving,
	})

	const onFieldReset = (key: PoseKey) => targets.reset(key)

	const execute = () => {
		if (isUnitOrientationVector(pose)) {
			moveToPosition(pose)
			return
		}
		const normalized = normalizeOrientationVector(pose)
		onPoseChange(normalized)
		moveToPosition(normalized)
	}

	const resetToZero = () => {
		for (const key of POSE_KEYS) {
			targets.edit(key, 0)
		}
	}
</script>

{#snippet statusMessage({ kind, label, amount }: PoseStatusMessage)}
	{#if kind === 'drift'}
		Arm moved {amount} since you edited {label}.
	{:else}
		The arm is moving. Your edit is kept.
	{/if}
{/snippet}

<div class="flex min-w-0 flex-col gap-4">
	<PoseEditor
		{pose}
		{statusMessage}
		{fieldStatus}
		{description}
		{onPoseChange}
		{onFieldReset}
	>
		{#snippet heading()}Pose Values{/snippet}
	</PoseEditor>

	<div class="mb-2 flex flex-col gap-2">
		<span class="flex flex-row gap-2">
			<h4 class="text-xs font-semibold">Quick set</h4>
			<Tooltip let:tooltipID>
				<button
					type="button"
					aria-label="About Quick set"
					aria-describedby={tooltipID}
					class="focus-visible:ring-gray-9 inline-flex rounded focus-visible:ring-2 focus-visible:outline-none"
				>
					<Icon
						name="information-outline"
						cx="text-gray-6"
					/>
				</button>

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
			onclick={execute}
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
	<ErrorDisplay {lastError} />
</div>
