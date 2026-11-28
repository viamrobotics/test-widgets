<script lang="ts">
	import { MovementSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
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

	const MISSING_VALUE = '-'

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'movement-sensor/getReadings'
	)

	const client = createResourceClient(
		MovementSensorClient,
		() => partID,
		() => resourceName
	)

	const missingLabelId = $props.id()

	const readingsQuery = createResourceQuery(client, 'getReadings', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const readings = $derived(readingsQuery.data)
</script>

<ApiSection
	method="GetReadings"
	api={ResourceTriplets.MovementSensor}
	queries={[readingsQuery]}
	class="grow flex-col gap-4"
>
	{#if readings === undefined}
		<div class="flex min-w-0 items-center gap-2">
			<span
				id={missingLabelId}
				class="text-subtle-1 text-xs">Readings</span
			>
			<span
				role="group"
				aria-labelledby={missingLabelId}
				class="readout font-roboto-mono"
			>
				<span class="readout-value">{MISSING_VALUE}</span>
			</span>
		</div>
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
