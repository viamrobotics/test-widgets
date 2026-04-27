<script lang="ts">
	import { AudioInClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import Query from '$lib/components/query.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'

	import Properties from './properties.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'audio-input'
	)

	const client = createResourceClient(
		AudioInClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties', () => ({
		refetchInterval: refetchInterval.current,
	}))
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="p-4 pb-3">
			<RefetchController
				{refetchInterval}
				queries={[propertiesQuery]}
			/>
		</div>

		<ApiSection
			title="GetProperties"
			description="Audio input properties"
			class="relative"
		>
			<Query
				query={propertiesQuery}
				contentCx="h-6"
			>
				{#if propertiesQuery.data !== undefined}
					<Properties
						supportedCodecs={propertiesQuery.data.supportedCodecs}
						sampleRateHz={propertiesQuery.data.sampleRateHz}
						numChannels={propertiesQuery.data.numChannels}
					/>
				{/if}
			</Query>
		</ApiSection>
	{/snippet}
</ConnectionStatus>
