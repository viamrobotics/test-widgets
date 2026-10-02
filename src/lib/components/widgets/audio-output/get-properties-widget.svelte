<script lang="ts">
	import { AudioOutClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import Properties from '$lib/components/audio-properties.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		AudioOutClient,
		() => partID,
		() => resourceName
	)

	const query = createResourceQuery(client, 'getProperties', { refetchInterval: 500 })
</script>

<ApiSection
	method="GetProperties"
	api={ResourceTriplets.AudioOutput}
	queries={[query]}
	class="grow flex-col gap-4"
>
	{#snippet subheading()}
		<Section.Text>Audio output properties</Section.Text>
	{/snippet}
	{#if query.data !== undefined}
		<Properties
			supportedCodecs={query.data.supportedCodecs}
			sampleRateHz={query.data.sampleRateHz}
			numChannels={query.data.numChannels}
		/>
	{/if}
</ApiSection>
