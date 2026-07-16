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
		isPending: boolean
		lastError: Error | null
		/** Namespace for persisting the optional-JSON drafts, e.g. `${partID}/${resourceName}/motion-move`. */
		storageKey: string
		onExecute: (input: MoveInput) => void
	}

	const { componentName, isPending, lastError, storageKey, onExecute }: Props = $props()

	let referenceFrame = $state('world')
	let pose = $state<Pose>({ x: 0, y: 0, z: 0, oX: 0, oY: 0, oZ: 1, theta: 0 })

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
			referenceFrame = frame
		}}
		onPoseChange={(next) => {
			pose = next
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
