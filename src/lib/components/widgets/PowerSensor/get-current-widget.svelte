<script lang="ts">
	import { PowerSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import CurrentReading from './current-reading.svelte'

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

	const query = createResourceQuery(client, 'getCurrent', { refetchInterval: 500 })
</script>

<ApiSection
	queries={[query]}
	method="GetCurrent"
	api={ResourceTriplets.PowerSensor}
	class="grow flex-col gap-4"
>
	<CurrentReading data={query.data} />
	<Section.Text class="mt-auto">Updates automatically</Section.Text>
</ApiSection>
