<script lang="ts">
	import type { Snippet } from 'svelte'

	import { MotionClient, type RobotClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createRobotQuery,
		useRobotClient,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { type SectionQuery } from '$lib/components/section/use-section-errors.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Move from './move.svelte'
	import { type MoveInput, parseMoveArgs } from './parse-move-args'

	interface Props {
		partID: string
		resourceName: string
		/** The frame to move — a frame from the machine's frame system. */
		frameName: string
		/** The reference frame the destination pose is expressed in. */
		destination: string
		/** Queries the surrounding controls read, so their errors reach the section's indicator. */
		queries?: SectionQuery[]
		/** Controls rendered above the move form, inside the section. */
		children?: Snippet
	}

	const { partID, resourceName, frameName, destination, queries = [], children }: Props = $props()

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
	let parseError = $state<Error>()
	// A mutation-shaped source, so a pose that fails to parse shows in the section's indicator.
	const parseFailure = $derived({ error: parseError ?? null })

	const executeMove = (input: MoveInput) => {
		try {
			parseError = undefined
			move.mutate(parseMoveArgs(frameName, input), {})
		} catch (error) {
			parseError = error instanceof Error ? error : new Error(String(error))
		}
	}
</script>

<ApiSection
	class="grow flex-col gap-4"
	method="Move"
	api={ResourceTriplets.Motion}
	queries={[...queries, poseQuery]}
	mutations={[move, parseFailure]}
>
	<div class="flex min-w-0 flex-col gap-4">
		{@render children?.()}
		<Move
			{frameName}
			{destination}
			{currentPose}
			isPending={move.isPending}
			storageKey={`${partID}/${resourceName}/motion-move`}
			onExecute={executeMove}
		/>
	</div>
</ApiSection>
