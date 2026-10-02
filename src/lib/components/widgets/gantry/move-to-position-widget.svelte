<script lang="ts">
	import { GantryClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import Query from '$lib/components/query.svelte'
	import { Section } from '$lib/components/section'

	import MoveToPosition from './move-to-position.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		GantryClient,
		() => partID,
		() => resourceName
	)

	const positionQuery = createResourceQuery(client, 'getPosition', {
		refetchInterval: 500,
	})
	const moveMutation = createResourceMutation(client, 'moveToPosition')
</script>

<Query query={positionQuery}>
	{@const positions = positionQuery.data}
	{#if positions !== undefined}
		<MoveToPosition
			{positions}
			moveTo={(newPos: number[], speeds: number[]) => {
				moveMutation.mutate([newPos, speeds], {})
			}}
		/>
	{/if}
</Query>
<Section.Error error={moveMutation.error} />
