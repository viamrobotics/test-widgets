<script lang="ts">
	import { SwitchClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import ConnectionStatus from '#lib/components/ConnectionStatus.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import Position from './Position.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		SwitchClient,
		() => partID,
		() => resourceName
	)

	const positionQuery = createResourceQuery(client, 'getPosition', {
		refetchInterval: 500,
	})

	const numPositionsQuery = createResourceQuery(client, 'getNumberOfPositions', {
		refetchInterval: 500,
	})

	const setPositionMutation = createResourceMutation(client, 'setPosition')

	const onSelect = async (position: number) => {
		await setPositionMutation.mutateAsync([position])
		await positionQuery.refetch()
	}
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<ApiSection
			class="flex-col gap-4"
			method="SetPosition"
			api={ResourceTriplets.Switch}
			queries={[positionQuery, numPositionsQuery]}
			mutations={[setPositionMutation]}
		>
			{#if positionQuery.data !== undefined && numPositionsQuery.data !== undefined}
				<Position
					numPositions={numPositionsQuery.data[0]}
					labels={numPositionsQuery.data[1]}
					currentPosition={positionQuery.data}
					{onSelect}
				/>
			{/if}
		</ApiSection>
	{/snippet}
</ConnectionStatus>
