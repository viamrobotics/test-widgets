<script lang="ts">
	import { SlamClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import Query from '$lib/components/query.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Position from './position.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		SlamClient,
		() => partID,
		() => resourceName
	)

	const query = createResourceQuery(client, 'getPosition', { refetchInterval: 1000 })
</script>

<ApiSection
	method="GetPosition"
	api={ResourceTriplets.Slam}
	class="grow flex-col gap-4"
>
	<Query {query}>
		{#if query.data !== undefined}
			<Position position={query.data} />
		{/if}
	</Query>
</ApiSection>
