<!--
@component

The arm's 3D scene for `ArmControls`, from visualization's scoped scene. It fills its parent box. On a
builtin motion service it adds a target gizmo and a Plan preview folder that plans the staged goal,
draws the plan, and executes it.
-->
<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { Folder, Panel } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { type JsonValue, MotionClient } from '@viamrobotics/sdk'
	import { createResourceClient } from '@viamrobotics/svelte-sdk'
	import {
		type MoveTarget,
		MoveTargetGizmo,
		parsePlanResult,
		ScopedScene,
		TrajectoryPreview,
		type TrajectoryStep,
	} from '@viamrobotics/visualization/scoped-scene'

	import RenderLoopGuard from '$lib/components/three/render-loop-guard.svelte'

	import type { ArmSceneProps } from '../arm-scene-context'

	import { executeCommand, planCommand } from '../builtin-plan-command'

	const { partID, resourceName, isBuiltin, guard, onError }: ArmSceneProps = $props()

	const BUILTIN_MOTION_SERVICE = 'builtin'

	const motionClient = createResourceClient(
		MotionClient,
		() => partID,
		() => BUILTIN_MOTION_SERVICE
	)

	let target = $state.raw<MoveTarget>()
	let trajectory = $state.raw<TrajectoryStep[]>()
	let isPlanning = $state(false)
	// Read by the status node, which sits outside the Folder so it announces while the Folder is folded.
	let planStatus = $state('')
	// Bumped by every drag, so a plan reply for an earlier goal is dropped rather than shown.
	let goalVersion = 0

	const toError = (error: unknown): Error =>
		error instanceof Error ? error : new Error(String(error), { cause: error })

	const reportMessage = (message: string) => {
		onError(new Error(message))
	}

	const sendDoCommand = (command: Record<string, JsonValue>) => {
		const client = motionClient.current
		if (client === undefined) {
			throw new Error('The motion service is not connected.')
		}
		return client.doCommand(command)
	}

	const invalidatePlan = () => {
		goalVersion += 1
		trajectory = undefined
		planStatus = ''
	}

	const formatMillimeters = (value: number) => value.toFixed(2)

	const goalText = $derived.by(() => {
		if (target === undefined) {
			return 'No goal staged. Drag the target in the scene to stage one.'
		}
		const { x, y, z } = target.pose
		return `Goal staged: X ${formatMillimeters(x)}, Y ${formatMillimeters(y)}, Z ${formatMillimeters(z)} mm`
	})

	const previewLabel = $derived(trajectory === undefined ? 'Preview move' : 'Re-plan preview')
	const isPreviewDisabled = $derived(target === undefined || isPlanning)
	const isExecuteDisabled = $derived(trajectory === undefined || guard.isBusy)

	const previewMove = async () => {
		const goal = target
		if (goal === undefined || isPreviewDisabled) {
			return
		}
		const version = goalVersion
		isPlanning = true
		planStatus = 'Planning'
		onError(undefined)
		try {
			const reply = await sendDoCommand(
				planCommand(
					[{ referenceFrame: goal.referenceFrame, pose: goal.pose }, resourceName],
					undefined
				)
			)
			if (version === goalVersion) {
				const planned = parsePlanResult(reply).trajectory
				trajectory = planned
				planStatus = `Plan ready, ${planned.length} steps`
			}
		} catch (error) {
			if (version === goalVersion) {
				planStatus = 'Plan failed'
				onError(toError(error))
			}
		} finally {
			isPlanning = false
		}
	}

	const executePlan = () => {
		const plan = trajectory
		if (plan === undefined || isExecuteDisabled) {
			return
		}
		// The guard drops a press made while the group is busy, and its outcome never rejects.
		void guard.run(async () => {
			planStatus = 'Executing'
			onError(undefined)
			try {
				await sendDoCommand(executeCommand(plan))
				planStatus = 'Plan executed'
			} catch (error) {
				planStatus = 'Execute failed'
				onError(toError(error))
				throw error
			}
		})
	}
</script>

<div
	role="region"
	aria-label={`${resourceName} 3D scene`}
	class="relative h-full w-full"
>
	<ScopedScene
		{partID}
		frame={resourceName}
		onError={reportMessage}
	>
		<RenderLoopGuard {onError} />
		{#if isBuiltin}
			<MoveTargetGizmo
				frame={resourceName}
				bind:target
				onDrag={invalidatePlan}
				onRelease={invalidatePlan}
			/>
			<TrajectoryPreview
				{trajectory}
				onError={reportMessage}
			/>
		{/if}
	</ScopedScene>

	{#if isBuiltin}
		<p
			role="status"
			class="sr-only"
		>
			{planStatus}
		</p>
		<div class="absolute top-2 right-2 z-10 w-54 max-w-full">
			<Panel aria-label="Plan preview">
				<Folder title="Plan preview">
					<div class="flex flex-col gap-2">
						<p class="text-subtle-1 text-xs leading-4">
							{goalText}
						</p>
						<div class="flex flex-wrap items-center gap-2">
							<button
								type="button"
								class="button button-compact"
								aria-disabled={isPreviewDisabled || undefined}
								onclick={previewMove}
							>
								{previewLabel}
							</button>
							<button
								type="button"
								class="button button-dark button-compact"
								aria-disabled={isExecuteDisabled || undefined}
								onclick={executePlan}
							>
								<Icon
									icon={mdiPlayCircleOutline}
									size="sm"
									aria-hidden="true"
								/>
								Execute plan
							</button>
						</div>
					</div>
				</Folder>
			</Panel>
		</div>
	{/if}
</div>
