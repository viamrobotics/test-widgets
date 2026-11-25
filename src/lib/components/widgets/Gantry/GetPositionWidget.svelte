<script lang="ts">
	import { GantryClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { Section } from '#lib/components/Section/index.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import PositionAndLengths from './PositionAndLengths.svelte'

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
	queries={[positionQuery, lengthsQuery]}
>
	{@const positions = positionQuery.data}
	{@const lengths = lengthsQuery.data ?? []}
	{#if positions !== undefined}
		<PositionAndLengths
			{positions}
			{lengths}
		/>
	{/if}
	<Section.Text class="mt-auto">Updates automatically</Section.Text>
</ApiSection>
