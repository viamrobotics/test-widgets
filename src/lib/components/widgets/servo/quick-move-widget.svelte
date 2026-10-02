<script lang="ts">
	import { ServoClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import Query from '$lib/components/query.svelte'
	import { Section } from '$lib/components/section'

	import QuickMove from './quick-move.svelte'

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
	const quickMoveMutation = createResourceMutation(client, 'move')

	const quickMoveTo = (angle: number) => {
		quickMoveMutation.mutate([angle], {})
	}
</script>

<Query query={positionQuery}>
	{#if positionQuery.data !== undefined}
		<QuickMove
			currentPosition={positionQuery.data}
			moveTo={quickMoveTo}
		/>
	{/if}
</Query>
<Section.Error error={quickMoveMutation.error} />
