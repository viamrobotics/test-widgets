<script lang="ts">
	import { MovementSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import PropertiesReadout from './PropertiesReadout.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		MovementSensorClient,
		() => partID,
		() => resourceName
	)

	// The properties do not change while the sensor runs, so they are read once.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })
</script>

<ApiSection
	method="GetProperties"
	api={ResourceTriplets.MovementSensor}
	queries={[propertiesQuery]}
	class="grow flex-col gap-1"
>
	<PropertiesReadout properties={propertiesQuery.data} />
</ApiSection>
