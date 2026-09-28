<script lang="ts">
	import { PowerSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import Query from '$lib/components/query.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import PowerReading from './power-reading.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		PowerSensorClient,
		() => partID,
		() => resourceName
	)

	const query = createResourceQuery(client, 'getPower', { refetchInterval: 500 })
</script>

<ApiSection
	method="GetPower"
	api={ResourceTriplets.PowerSensor}
	class="grow flex-col gap-4"
>
	<Query {query}>
		{#if query.data !== undefined}
			<PowerReading data={query.data} />
		{/if}
	</Query>
</ApiSection>
