<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import Query from '$lib/components/query.svelte'

	import QuickMove from './quick-move.svelte'

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

	const jointPositionsQuery = createResourceQuery(client, 'getJointPositions', {
		refetchInterval: 500,
	})

	const quickMoveToJointPosMutation = createResourceMutation(client, 'moveToJointPositions')

	const quickMoveToJointPositions = (jointPositionsList: number[]) => {
		quickMoveToJointPosMutation.mutate([jointPositionsList], {})
	}
</script>

<Query query={jointPositionsQuery}>
	{#if jointPositionsQuery.data}
		<QuickMove
			positions={jointPositionsQuery.data.values}
			moveToJointPositions={quickMoveToJointPositions}
			lastError={quickMoveToJointPosMutation.error}
		/>
	{/if}
</Query>
