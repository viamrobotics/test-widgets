<script lang="ts">
	import { MotionClient, type RobotClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createRobotQuery,
		useRobotClient,
	} from '@viamrobotics/svelte-sdk'

	import Move from './move.svelte'
	import { type MoveInput, parseMoveArgs } from './parse-move-args'

	interface Props {
		partID: string
		resourceName: string
		/** The frame to move — a frame from the machine's frame system. */
		frameName: string
		/** The reference frame the destination pose is expressed in. */
		destination: string
	}

	const { partID, resourceName, frameName, destination }: Props = $props()

	const robotClient = useRobotClient(() => partID)
	const client = createResourceClient(
		MotionClient,
		() => partID,
		() => resourceName
	)

	const move = createResourceMutation(client, 'move')

	// Pre-fill the editor with the frame's current pose in the destination frame.
	const poseArgs = $derived<Parameters<RobotClient['getPose']>>([frameName, destination, []])
	const poseQuery = createRobotQuery(
		robotClient,
		'getPose',
		() => poseArgs,
		() => ({ enabled: frameName !== '' })
	)

	const currentPose = $derived(poseQuery.data?.pose)
	const poseError = $derived(poseQuery.error instanceof Error ? poseQuery.error : null)

	let parseError = $state<Error>()

	const executeMove = (input: MoveInput) => {
		try {
			parseError = undefined
			move.mutate(parseMoveArgs(frameName, input), {})
		} catch (error) {
			parseError = error instanceof Error ? error : new Error(String(error))
		}
	}
</script>

<Move
	{frameName}
	{destination}
	{currentPose}
	isPending={move.isPending}
	lastError={parseError ?? move.error ?? poseError}
	storageKey={`${partID}/${resourceName}/motion-move`}
	onExecute={executeMove}
/>
