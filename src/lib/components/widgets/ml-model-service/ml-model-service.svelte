<script lang="ts">
	import { MLModelClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ConnectionStatus from '#lib/components/connection-status.svelte'
	import RefetchController from '#lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '#lib/components/refetch-interval-store.svelte.js'

	import MetadataWidget from './metadata-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'ml-model-service'
	)

	const client = createResourceClient(
		// @ts-expect-error No resource type overlap
		MLModelClient,
		() => partID,
		() => resourceName
	)

	// Never polls. It observes the Metadata widget's cache entry so manual refresh reaches it.
	// @ts-expect-error No resource overlap
	const metadataQuery = createResourceQuery(client, 'metadata', { refetchInterval: false })
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="flex flex-wrap gap-4 p-4 pb-3">
			<RefetchController
				allowLive
				{refetchInterval}
				queries={[metadataQuery]}
			/>
		</div>

		<MetadataWidget
			{partID}
			{resourceName}
			refetchInterval={refetchInterval.current}
		/>
	{/snippet}
</ConnectionStatus>
