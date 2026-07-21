<script lang="ts">
	import type { Pose } from '@viamrobotics/sdk'

	import { Button, Progress } from '@viamrobotics/prime-core'
	import { CodeEditor } from '@viamrobotics/prime-core/code-editor'
	import { PersistedState } from 'runed'

	import ErrorDisplay from '$lib/components/error.svelte'

	import type { MoveInput } from './parse-move-args'

	import PoseInFrameInput from './pose-in-frame-input.svelte'

	interface Props {
		componentName: string
		currentPose?: Pose
		currentReferenceFrame?: string
		isPending: boolean
		lastError: Error | null
		storageKey: string
		onExecute: (input: MoveInput) => void
	}

	const {
		componentName,
		currentPose,
		currentReferenceFrame,
		isPending,
		lastError,
		storageKey,
		onExecute,
	}: Props = $props()

	const zeroPose: Pose = { x: 0, y: 0, z: 0, oX: 0, oY: 0, oZ: 1, theta: 0 }

	let edit = $state<{ component: string; referenceFrame: string; pose: Pose }>()
	const isEdited = $derived(edit?.component === componentName)
	const referenceFrame = $derived(
		isEdited && edit ? edit.referenceFrame : (currentReferenceFrame ?? 'world')
	)

	const pose = $derived(isEdited && edit ? edit.pose : (currentPose ?? zeroPose))

	// PersistedState is created inside $derived so Svelte can track the storageKey
	// dependency. The localStorage read on construction is benign and idempotent.
	// storageKey is stable for the lifetime of this component.
	const worldState = $derived(new PersistedState(`${storageKey}/world-state`, ''))
	const constraints = $derived(new PersistedState(`${storageKey}/constraints`, ''))

	const disabled = $derived(componentName === '' || isPending)

	const execute = () => {
		onExecute({
			referenceFrame,
			pose,
			worldStateJson: worldState.current,
			constraintsJson: constraints.current,
		})
	}
</script>

<div class="flex min-w-0 flex-col gap-4">
	<PoseInFrameInput
		{referenceFrame}
		{pose}
		onReferenceFrameChange={(frame) => {
			edit = { component: componentName, referenceFrame: frame, pose }
		}}
		onPoseChange={(next) => {
			edit = { component: componentName, referenceFrame, pose: next }
		}}
	/>

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
