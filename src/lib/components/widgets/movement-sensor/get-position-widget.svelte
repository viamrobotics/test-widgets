<script lang="ts">
	import { MovementSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Position from './position.svelte'

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

	const query = createResourceQuery(client, 'getPosition', { refetchInterval: 500 })
</script>

<ApiSection
	method="GetPosition"
	api={ResourceTriplets.MovementSensor}
	queries={[query]}
	class="grow flex-col gap-4"
>
	{#if query.data !== undefined}
		<Position data={query.data} />
	{/if}
</ApiSection>
