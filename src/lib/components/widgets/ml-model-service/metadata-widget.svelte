<script lang="ts">
	import { type Metadata, MLModelClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/api-section.svelte'
	import {
		type RefetchInterval,
		RefetchIntervals,
	} from '#lib/components/refetch-interval-store.svelte.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import ResultsTable from './results-table.svelte'

	interface Props {
		partID: string
		resourceName: string
		/**
		 * How often to poll. The composite card passes its refresh-rate picker's value. A rate
		 * faster than once a second is slowed to once a second.
		 */
		refetchInterval?: RefetchInterval
	}

	const { partID, resourceName, refetchInterval = RefetchIntervals.ONE_SEC }: Props = $props()

	const client = createResourceClient(
		// @ts-expect-error No resource type overlap
		MLModelClient,
		() => partID,
		() => resourceName
	)

	// @ts-expect-error No resource overlap
	const metadataQuery = createResourceQuery(client, 'metadata', () => ({
		// A model's metadata rarely changes, so polling faster than 1 Hz is wasteful.
		refetchInterval:
			refetchInterval === false ? false : Math.max(refetchInterval, RefetchIntervals.ONE_SEC),
	}))

	const metadata = $derived((metadataQuery.data as unknown as { metadata: Metadata })?.metadata)
</script>

<ApiSection
	method="Metadata"
	api={ResourceTriplets.MLModel}
	queries={[metadataQuery]}
	class="flex-col gap-4"
>
	{#if metadata !== undefined}
		<ResultsTable {metadata} />
	{/if}
</ApiSection>
