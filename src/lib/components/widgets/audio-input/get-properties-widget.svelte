<script lang="ts">
	import { AudioInClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import Query from '$lib/components/query.svelte'

	import Properties from './properties.svelte'

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
	title="GetProperties"
	description="Audio input properties"
	class="grow"
>
	<Query
		{query}
		contentCx="h-6"
	>
		{#if query.data !== undefined}
			<Properties
				supportedCodecs={query.data.supportedCodecs}
				sampleRateHz={query.data.sampleRateHz}
				numChannels={query.data.numChannels}
			/>
		{/if}
	</Query>
</ApiSection>
