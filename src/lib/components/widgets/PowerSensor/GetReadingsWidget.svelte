<script lang="ts">
	import { PowerSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import CopyButton from '#lib/components/CopyButton.svelte'
	import ReadingsList from '#lib/components/ReadingsList.svelte'
	import { createRefetchIntervalStore } from '#lib/components/refetch-interval-store.svelte.js'
	import RefetchController from '#lib/components/RefetchController.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import ReadingRow from './ReadingRow.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'power-sensor/getReadings'
	)

	const client = createResourceClient(
		PowerSensorClient,
		() => partID,
		() => resourceName
	)

	const readingsQuery = createResourceQuery(client, 'getReadings', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const readings = $derived(readingsQuery.data)
</script>

<ApiSection
	method="GetReadings"
	api={ResourceTriplets.PowerSensor}
	queries={[readingsQuery]}
	class="grow flex-col gap-4"
>
	{#if readings === undefined}
		<ReadingRow
			label="Readings"
			value={undefined}
		/>
	{:else}
		<div class="flex justify-end">
			<CopyButton
				data={JSON.stringify(readings, null, 2)}
				ariaLabel="Copy JSON"
			/>
		</div>
		<ReadingsList
			data={readings}
			showCopy={false}
		/>
	{/if}
	<div class="mt-auto">
		<RefetchController
			{refetchInterval}
			queries={[readingsQuery]}
		/>
	</div>
</ApiSection>
