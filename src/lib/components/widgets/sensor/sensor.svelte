<script lang="ts">
	import { SensorClient } from '@viamrobotics/sdk';
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk';

	import ApiSection from '$lib/components/api-section.svelte';
	import ConnectionStatus from '$lib/components/connection-status.svelte';
	import Query from '$lib/components/query.svelte';
	import ReadingsList from '$lib/components/readings-list.svelte';
	import { createRefetchIntervalStore } from '$lib/components/refetch-controller';
	import RefetchController from '$lib/components/refetch-controller.svelte';

	interface Props {
		partID: string;
		resourceName: string;
	}

	const { partID, resourceName }: Props = $props();

	const refetchInterval = createRefetchIntervalStore(partID, resourceName, 'sensor-view');

	const client = createResourceClient(
		SensorClient,
		() => partID,
		() => resourceName
	);

	const readingsQuery = createResourceQuery(client, 'getReadings', () => ({
		refetchInterval: $refetchInterval
	}));
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="p-4 pb-3">
			<RefetchController
				{refetchInterval}
				queries={[readingsQuery]}
			/>
		</div>

		<ApiSection
			title="GetReadings"
			class="relative"
		>
			<Query
				query={readingsQuery}
				contentCx="h-6"
			>
				{#if readingsQuery.data !== undefined}
					<ReadingsList data={readingsQuery.data} />
				{/if}
			</Query>
		</ApiSection>
	{/snippet}
</ConnectionStatus>
