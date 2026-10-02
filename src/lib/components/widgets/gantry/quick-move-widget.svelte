<script lang="ts">
	import { GantryClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ErrorDisplay from '$lib/components/error.svelte'
	import Query from '$lib/components/query.svelte'

	import QuickMove from './quick-move.svelte'

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

	const quickMoveMutation = createResourceMutation(client, 'moveToPosition')
</script>

<Query
	query={positionQuery}
	class="h-6"
>
	{@const positions = positionQuery.data}
	{#if positions !== undefined}
		<QuickMove
			{positions}
			moveTo={(newPos: number[], speeds: number[]) => {
				quickMoveMutation.mutate([newPos, speeds], {})
			}}
		/>
	{/if}
</Query>
<ErrorDisplay lastError={quickMoveMutation.error} />
