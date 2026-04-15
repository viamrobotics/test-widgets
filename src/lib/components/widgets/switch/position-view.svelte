<script lang="ts">
	import { SwitchClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import Queries from '$lib/components/queries.svelte'

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

	const numPositionsQuery = createResourceQuery(client, 'getNumberOfPositions', {
		refetchInterval: 500,
	})

	const setPositionMutation = createResourceMutation(
		client,
		'setPosition',
		() => positionQuery.queryKey
	)

	const onSelect = async (position: number) => {
		await setPositionMutation.mutateAsync([position])
		await positionQuery.refetch()
	}
</script>

<Queries
	queries={[positionQuery, numPositionsQuery]}
	contentCx="h-7.5"
>
	{#if positionQuery.data !== undefined && numPositionsQuery.data !== undefined}
		<Position
			numPositions={numPositionsQuery.data[0]}
			labels={numPositionsQuery.data[1]}
			currentPosition={positionQuery.data}
			{onSelect}
			lastError={setPositionMutation.error}
		/>
	{/if}
</Queries>
