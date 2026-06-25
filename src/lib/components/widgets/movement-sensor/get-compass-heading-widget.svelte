<script lang="ts">
	import { MovementSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import Query from '$lib/components/query.svelte'

	import CompassHeading from './compass-heading.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		MovementSensorClient,
		() => partID,
		() => resourceName
	)

	const query = createResourceQuery(client, 'getCompassHeading', { refetchInterval: 500 })
</script>

<ApiSection
	title="GetCompassHeading"
	class="grow"
>
	<Query
		{query}
		contentCx="h-6"
	>
		{#if query.data !== undefined}
			<CompassHeading data={query.data} />
		{/if}
	</Query>
</ApiSection>
