<script lang="ts">
	import type { Pose } from '@viamrobotics/sdk'

	import { Button, Icon, Progress, Tooltip } from '@viamrobotics/prime-core'
	import { CodeEditor } from '@viamrobotics/prime-core/code-editor'
	import { PersistedState } from 'runed'

	import ErrorDisplay from '$lib/components/error.svelte'
	import PoseEditor from '$lib/components/pose-editor.svelte'

	import type { MoveInput } from './parse-move-args'

	interface Props {
		/** The frame being moved. Gates execution and re-seeds the editor on change. */
		frameName: string
		/** The reference frame the destination pose is expressed in. */
		destination: string
		currentPose?: Pose
		isPending: boolean
		lastError: Error | null
		storageKey: string
		onExecute: (input: MoveInput) => void
	}

	const {
		frameName,
		destination,
		currentPose,
		isPending,
		lastError,
		storageKey,
		onExecute,
	}: Props = $props()

	const zeroPose: Pose = { x: 0, y: 0, z: 0, oX: 0, oY: 0, oZ: 1, theta: 0 }

	const editKey = $derived(JSON.stringify([frameName, destination]))
	let edit = $state<{ key: string; pose: Pose }>()
	const isEdited = $derived(edit?.key === editKey)
	const pose = $derived(isEdited && edit ? edit.pose : (currentPose ?? zeroPose))

	const worldState = $derived(new PersistedState(`${storageKey}/world-state`, ''))
	const constraints = $derived(new PersistedState(`${storageKey}/constraints`, ''))

	const disabled = $derived(frameName === '' || isPending)

	const execute = () => {
		onExecute({
			referenceFrame: destination,
			pose,
			worldStateJson: worldState.current,
			constraintsJson: constraints.current,
		})
	}
</script>

<div class="flex min-w-0 flex-col gap-4">
	<PoseEditor
		{pose}
		onPoseChange={(next) => {
			edit = { key: editKey, pose: next }
		}}
		title="Destination pose"
		description="The target pose expressed in the selected reference frame. Translations are in millimeters."
	/>

	<div class="flex flex-col gap-2">
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
		<Button
			class="w-fit"
			onclick={() => {
				edit = { key: editKey, pose: zeroPose }
			}}
		>
			Zero
		</Button>
	</div>

	<div class="flex flex-col gap-1">
		<span class="text-xs font-medium">
			World state <abbr class="text-subtle-2">(optional JSON)</abbr>
		</span>
		<CodeEditor
			label="World state"
			language="json"
			value={worldState.current}
			onChange={(next: string) => {
				worldState.current = next
			}}
			class="h-32 overflow-y-auto"
		/>
	</div>

	<div class="flex flex-col gap-1">
		<span class="text-xs font-medium">
			Constraints <abbr class="text-subtle-2">(optional JSON)</abbr>
		</span>
		<CodeEditor
			label="Constraints"
			language="json"
			value={constraints.current}
			onChange={(next: string) => {
				constraints.current = next
			}}
			class="h-32 overflow-y-auto"
		/>
	</div>

	<div class="flex items-center gap-2">
		<Button
			class="w-fit"
			icon="play-circle-outline"
			variant="dark"
			{disabled}
			onclick={execute}
		>
			Execute
		</Button>
		{#if isPending}
			<Progress
				size="medium"
				variant="dark"
			/>
		{/if}
	</div>

	<p class="text-subtle-2 text-xs">
		Move blocks until the motion completes. Stop the component itself to interrupt.
	</p>

	<ErrorDisplay {lastError} />
</div>
