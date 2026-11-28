<script lang="ts">
	import { PowerSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { createRefetchIntervalStore } from '#lib/components/refetch-interval-store.svelte.js'
	import RefetchController from '#lib/components/RefetchController.svelte'
	import { Section } from '#lib/components/Section/index.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import BatteryReading from './BatteryReading.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'power-sensor/getBatteryPercent'
	)

	const client = createResourceClient(
		PowerSensorClient,
		() => partID,
		() => resourceName
	)

	// A machine whose RDK predates GetProperties fails this query. The widget then reads as
	// unsupported, and the failure is not shown, since the section does not list this query.
	const propertiesQuery = createResourceQuery(client, 'getProperties')

	const isSupported = $derived(propertiesQuery.data?.isBatteryPercentSupported === true)
	const isUnsupported = $derived(
		propertiesQuery.isError || propertiesQuery.data?.isBatteryPercentSupported === false
	)

	const isChargingSupported = $derived(propertiesQuery.data?.isChargingSupported === true)

	const query = createResourceQuery(client, 'getBatteryPercent', () => ({
		enabled: isSupported,
		refetchInterval: refetchInterval.current,
	}))
</script>

<ApiSection
	queries={[query]}
	method="GetBatteryPercent"
	api={ResourceTriplets.PowerSensor}
	class="grow flex-col gap-4"
>
	{#if isUnsupported}
		<Section.Text>This power sensor does not report a battery percent.</Section.Text>
	{:else}
		<BatteryReading
			data={query.data}
			{isChargingSupported}
		/>
		<div class="mt-auto">
			<RefetchController
				{refetchInterval}
				queries={[query]}
			/>
		</div>
	{/if}
</ApiSection>
