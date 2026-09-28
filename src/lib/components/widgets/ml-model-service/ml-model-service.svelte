<script lang="ts">
	import { type Metadata, MLModelClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import Queries from '$lib/components/queries.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import ResultsTable from './results-table.svelte'

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

	// @ts-expect-error No resource overlap
	const metadataQuery = createResourceQuery(client, 'metadata', () => ({
		// Lower bound of 1Hz for getProperties, higher frequencies are wasteful.
		refetchInterval:
			refetchInterval.current === false
				? false
				: (Math.max(refetchInterval.current, 1000) as number | false),
	}))

	const metadata = $derived((metadataQuery.data as unknown as { metadata: Metadata })?.metadata)
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="flex p-4">
			<RefetchController
				allowLive
				{refetchInterval}
				queries={[metadataQuery]}
			/>
		</div>

		<ApiSection
			method="Metadata"
			api={ResourceTriplets.MLModel}
			class="flex-col gap-4"
		>
			<Queries queries={[metadataQuery]}>
				{#if metadata !== undefined}
					<ResultsTable {metadata} />
				{/if}
			</Queries>
		</ApiSection>
	{/snippet}
</ConnectionStatus>
