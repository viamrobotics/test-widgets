<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { Section } from '#lib/components/Section/index.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import GetJointPositions from './GetJointPositions.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		ArmClient,
		() => partID,
		() => resourceName
	)

	const query = createResourceQuery(client, 'getJointPositions', { refetchInterval: 500 })
</script>

<ApiSection
	method="GetJointPositions"
	api={ResourceTriplets.Arm}
	queries={[query]}
	class="grow flex-col gap-4"
>
	{#if query.data}
		<GetJointPositions positions={query.data.values} />
	{/if}
	<Section.Text class="mt-auto">Updates automatically</Section.Text>
</ApiSection>
