<script lang="ts">
	import { GantryClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import Queries from '$lib/components/queries.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import PositionAndLengths from './position-and-lengths.svelte'

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

	const options = { refetchInterval: 500 }
	const positionQuery = createResourceQuery(client, 'getPosition', options)
	const lengthsQuery = createResourceQuery(client, 'getLengths', options)
</script>

<ApiSection
	method="GetPosition"
	api={ResourceTriplets.Gantry}
	class="grow flex-col gap-4"
>
	<Queries queries={[positionQuery, lengthsQuery]}>
		{@const positions = positionQuery.data}
		{@const lengths = lengthsQuery.data ?? []}
		{#if positions !== undefined}
			<PositionAndLengths
				{positions}
				{lengths}
			/>
		{/if}
	</Queries>
	<Section.Text class="mt-auto">Updates automatically</Section.Text>
</ApiSection>
