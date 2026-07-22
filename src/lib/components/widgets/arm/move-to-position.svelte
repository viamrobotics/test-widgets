<script lang="ts">
	import type { Pose } from '@viamrobotics/sdk'

	import { Button, Icon, Tooltip } from '@viamrobotics/prime-core'

	import ErrorDisplay from '$lib/components/error.svelte'
	import PoseEditor from '$lib/components/pose-editor.svelte'

	interface Props {
		endPosition: Pose
		moveToPosition: (position: Pose) => void
		lastError: Error | null
	}

	const { endPosition, moveToPosition, lastError }: Props = $props()

	// svelte-ignore state_referenced_locally
	let desiredPosition = $state({ ...endPosition })

	const resetToZero = () => {
		desiredPosition = {
			x: 0,
			y: 0,
			z: 0,
			oX: 0,
			oY: 0,
			oZ: 0,
			theta: 0,
		}
	}

	const resetToCurrent = () => {
		desiredPosition = { ...endPosition }
	}
</script>

<div class="flex min-w-0 flex-col gap-4">
	<PoseEditor
		pose={desiredPosition}
		onPoseChange={(next) => {
			desiredPosition = next
		}}
		title="Pose Values"
		description="Pose is with respect to the arm origin and does not take into account the motion service or frame system."
	/>

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
			<Button onclick={resetToCurrent}>Current position</Button>
		</div>
	</div>
	<Button
		class="mt-auto w-fit"
		icon="play-circle-outline"
		variant="dark"
		onclick={() => moveToPosition(desiredPosition)}
	>
		Execute
	</Button>
	<ErrorDisplay {lastError} />
</div>
