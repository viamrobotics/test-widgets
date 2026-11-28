<script lang="ts">
	import { SensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import ConnectionStatus from '#lib/components/ConnectionStatus.svelte'
	import CopyButton from '#lib/components/CopyButton.svelte'
	import ReadingsList from '#lib/components/ReadingsList.svelte'
	import { createRefetchIntervalStore } from '#lib/components/refetch-interval-store.svelte.js'
	import RefetchController from '#lib/components/RefetchController.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'sensor'
	)

	const client = createResourceClient(
		SensorClient,
		() => partID,
		() => resourceName
	)

	const readingsQuery = createResourceQuery(client, 'getReadings', () => ({
		refetchInterval: refetchInterval.current,
	}))
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="p-4 pb-3">
			<div class="flex min-w-0 items-center gap-2">
				<div class="min-w-0 flex-1">
					<RefetchController
						{refetchInterval}
						queries={[readingsQuery]}
					/>
				</div>
				{#if readingsQuery.data !== undefined}
					<CopyButton
						data={JSON.stringify(readingsQuery.data, null, 2)}
						ariaLabel="Copy JSON"
					/>
				{/if}
			</div>
		</div>

		<ApiSection
			queries={[readingsQuery]}
			method="GetReadings"
			api={ResourceTriplets.Sensor}
			class="relative grow flex-col gap-4"
		>
			{#if readingsQuery.data !== undefined}
				<ReadingsList
					data={readingsQuery.data}
					showCopy={false}
				/>
			{/if}
		</ApiSection>
	{/snippet}
</ConnectionStatus>
