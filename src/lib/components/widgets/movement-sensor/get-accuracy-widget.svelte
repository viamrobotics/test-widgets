<script lang="ts">
	import { MovementSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Accuracy from './accuracy.svelte'

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

	const query = createResourceQuery(client, 'getAccuracy', { refetchInterval: 500 })
</script>

<ApiSection
	method="GetAccuracy"
	api={ResourceTriplets.MovementSensor}
	queries={[query]}
	class="grow flex-col gap-4"
>
	{#if query.data !== undefined}
		<Accuracy data={query.data} />
	{/if}
	<Section.Text class="mt-auto">Updates automatically</Section.Text>
</ApiSection>
