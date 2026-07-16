<script lang="ts">
	import { MotionClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createRobotQuery,
		useRobotClient,
	} from '@viamrobotics/svelte-sdk'

	import ComponentNameSelect from './component-name-select.svelte'
	import { movableFrameNames } from './movable-frame-names'
	import Move from './move.svelte'
	import { type MoveInput, parseMoveArgs } from './parse-move-args'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		MotionClient,
		() => partID,
		() => resourceName
	)

	const moveMutation = createResourceMutation(client, 'move')

	// Movable components come from the frame system, not a subtype allow-list:
	// anything with a configured frame is a valid Move target.
	const robotClient = useRobotClient(() => partID)
	const frameSystemQuery = createRobotQuery(robotClient, 'frameSystemConfig', () => ({
		refetchInterval: 5000,
	}))
	const frameNames = $derived(movableFrameNames(frameSystemQuery.data))

	// `undefined` means the user has not picked yet, so default to the first
	// frame; an explicit choice (including '') takes over.
	let selectedName = $state<string>()
	const componentName = $derived(selectedName ?? frameNames[0] ?? '')

	let parseError = $state<Error | null>(null)

	const executeMove = (input: MoveInput) => {
		try {
			parseError = null
			moveMutation.mutate(parseMoveArgs(componentName, input), {})
		} catch (error) {
			parseError = error instanceof Error ? error : new Error(String(error))
		}
	}
</script>

<div class="flex flex-col gap-4">
	<ComponentNameSelect
		value={componentName}
		options={frameNames}
		onChange={(value) => {
			selectedName = value
		}}
	/>
	<Move
		{componentName}
		isPending={moveMutation.isPending}
		lastError={parseError ?? moveMutation.error}
		storageKey={`${partID}/${resourceName}/motion-move`}
		onExecute={executeMove}
	/>
</div>
