<script lang="ts">
	import { PowerSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { createRefetchIntervalStore } from '#lib/components/refetch-interval-store.svelte.js'
	import RefetchController from '#lib/components/RefetchController.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import PowerReading from './PowerReading.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'power-sensor/getPower'
	)

	const client = createResourceClient(
		PowerSensorClient,
		() => partID,
		() => resourceName
	)

	const query = createResourceQuery(client, 'getPower', () => ({
		refetchInterval: refetchInterval.current,
	}))
</script>

<ApiSection
	queries={[query]}
	method="GetPower"
	api={ResourceTriplets.PowerSensor}
	class="grow flex-col gap-4"
>
	<PowerReading data={query.data} />
	<div class="mt-auto">
		<RefetchController
			{refetchInterval}
			queries={[query]}
		/>
	</div>
</ApiSection>
