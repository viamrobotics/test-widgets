<script lang="ts">
	import { PowerSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import VoltageReading from './voltage-reading.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		PowerSensorClient,
		() => partID,
		() => resourceName
	)

	const query = createResourceQuery(client, 'getVoltage', { refetchInterval: 500 })
</script>

<ApiSection
	queries={[query]}
	method="GetVoltage"
	api={ResourceTriplets.PowerSensor}
	class="grow flex-col gap-4"
>
	<VoltageReading data={query.data} />
	<Section.Text class="mt-auto">Updates automatically</Section.Text>
</ApiSection>
