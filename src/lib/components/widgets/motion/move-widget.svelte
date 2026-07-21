<script lang="ts">
	import { MotionClient, type RobotClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createRobotQuery,
		useRobotClient,
	} from '@viamrobotics/svelte-sdk'

	import ComponentNameSelect from './component-name-select.svelte'
	import { movableFrameNames, parentFrame } from './frame-system-config'
	import Move from './move.svelte'
	import { type MoveInput, parseMoveArgs } from './parse-move-args'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const robotClient = useRobotClient(() => partID)
	const client = createResourceClient(
		MotionClient,
		() => partID,
		() => resourceName
	)

	const move = createResourceMutation(client, 'move')
	const frameSystem = createRobotQuery(robotClient, 'frameSystemConfig', () => ({
		refetchInterval: 5000,
	}))
	const frameNames = $derived(movableFrameNames(frameSystem.data))

	let selectedName = $state<string>()
	const componentName = $derived(selectedName ?? frameNames[0] ?? '')

	const destinationFrame = $derived(parentFrame(frameSystem.data, componentName))
	const poseArgs = $derived<Parameters<RobotClient['getPose']>>([
		componentName,
		destinationFrame,
		[],
	])

	const poseQuery = createRobotQuery(
		robotClient,
		'getPose',
		() => poseArgs,
		() => ({ enabled: componentName !== '' })
	)

	const currentPose = $derived(poseQuery.data?.pose)
	const poseError = $derived(poseQuery.error instanceof Error ? poseQuery.error : null)

	let parseError = $state<Error>()

	const executeMove = (input: MoveInput) => {
		try {
			parseError = undefined
			move.mutate(parseMoveArgs(componentName, input), {})
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
		{currentPose}
		currentReferenceFrame={destinationFrame}
		isPending={move.isPending}
		lastError={parseError ?? move.error ?? poseError}
		storageKey={`${partID}/${resourceName}/motion-move`}
		onExecute={executeMove}
	/>
</div>
