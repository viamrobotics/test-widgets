<script lang="ts">
	import { ArmClient, type Pose } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import Query from '$lib/components/query.svelte'

	import MoveToPosition from './move-to-position.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		ArmClient,
		() => partID,
		() => resourceName
	)

	const endPositionQuery = createResourceQuery(client, 'getEndPosition', {
		refetchInterval: 500,
	})
	const moveToPosMutation = createResourceMutation(client, 'moveToPosition')
	const moveToPosition = (position: Pose) => {
		moveToPosMutation.mutate([position], {})
	}
</script>

<Query query={endPositionQuery}>
	{#if endPositionQuery.data}
		<MoveToPosition
			endPosition={endPositionQuery.data}
			{moveToPosition}
			lastError={moveToPosMutation.error}
		/>
	{/if}
</Query>
