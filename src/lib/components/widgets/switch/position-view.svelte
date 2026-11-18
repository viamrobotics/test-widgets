<script lang="ts">
	import { SwitchClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Position from './position.svelte'

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

	const numberOfPositionsQuery = createResourceQuery(client, 'getNumberOfPositions')

	const setPositionMutation = createResourceMutation(client, 'setPosition')

	// No optimistic write: the selection follows GetPosition, re-read once SetPosition settles.
	const onSelect = (position: number) => {
		setPositionMutation.mutate([position], {
			onSettled: () => {
				void positionQuery.refetch()
			},
		})
	}
</script>

<ApiSection
	class="flex-col gap-4"
	method="SetPosition"
	api={ResourceTriplets.Switch}
	queries={[positionQuery, numberOfPositionsQuery]}
	mutations={[setPositionMutation]}
>
	{#if positionQuery.data !== undefined && numberOfPositionsQuery.data !== undefined}
		<Position
			numPositions={numberOfPositionsQuery.data[0]}
			labels={numberOfPositionsQuery.data[1]}
			currentPosition={positionQuery.data}
			{onSelect}
		/>
	{/if}
</ApiSection>
