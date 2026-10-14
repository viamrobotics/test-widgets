<script lang="ts">
	import { ServoClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ErrorDisplay from '$lib/components/error.svelte'
	import Query from '$lib/components/query.svelte'

	import Move from './move.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		ServoClient,
		() => partID,
		() => resourceName
	)

	const positionQuery = createResourceQuery(client, 'getPosition', {
		refetchInterval: 500,
	})
	const moveMutation = createResourceMutation(client, 'move')

	const moveTo = (angle: number) => {
		moveMutation.mutate([angle], {})
	}
</script>

<Query query={positionQuery}>
	{#if positionQuery.data !== undefined}
		<Move
			currentPosition={positionQuery.data}
			{moveTo}
		/>
	{/if}
</Query>
<ErrorDisplay lastError={moveMutation.error} />
