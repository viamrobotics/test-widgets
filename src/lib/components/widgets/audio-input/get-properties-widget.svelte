<script lang="ts">
	import { AudioInClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import Properties from '$lib/components/audio-properties.svelte'
	import Query from '$lib/components/query.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		AudioInClient,
		() => partID,
		() => resourceName
	)

	const query = createResourceQuery(client, 'getProperties', { refetchInterval: 500 })
</script>

<ApiSection
	class="grow flex-col gap-4"
	method="GetProperties"
	api={ResourceTriplets.AudioInput}
>
	{#snippet subheading()}Audio input properties{/snippet}
	<Query {query}>
		{#if query.data !== undefined}
			<Properties
				supportedCodecs={query.data.supportedCodecs}
				sampleRateHz={query.data.sampleRateHz}
				numChannels={query.data.numChannels}
			/>
		{/if}
	</Query>
</ApiSection>
