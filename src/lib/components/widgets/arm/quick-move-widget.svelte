<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

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

<ApiSection
	method="MoveToJointPositions"
	api={ResourceTriplets.Arm}
	queries={[jointPositionsQuery]}
	mutations={[quickMoveToJointPosMutation]}
	class="grow flex-col gap-4"
>
	{#if jointPositionsQuery.data}
		<QuickMove
			positions={jointPositionsQuery.data.values}
			moveToJointPositions={quickMoveToJointPositions}
		/>
	{/if}
</ApiSection>
