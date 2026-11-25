<script lang="ts">
	import { EncoderClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import PropertiesReadout from './properties-readout.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		EncoderClient,
		() => partID,
		() => resourceName
	)

	// The properties do not change while the encoder runs, so they are read once.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })
</script>

<ApiSection
	method="GetProperties"
	api={ResourceTriplets.Encoder}
	queries={[propertiesQuery]}
	class="grow flex-col gap-1"
>
	{#snippet tooltip()}
		Returns which position types the encoder supports: ticks count, angle degrees, or both.
	{/snippet}
	<PropertiesReadout properties={propertiesQuery.data} />
</ApiSection>
