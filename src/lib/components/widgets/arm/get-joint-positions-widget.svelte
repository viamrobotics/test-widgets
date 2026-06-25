<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import Query from '$lib/components/query.svelte'

	import GetJointPositions from './get-joint-positions.svelte'

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
	title="GetJointPositions"
	bottomText="Updates automatically"
	class="grow"
>
	<Query {query}>
		{#if query.data}
			<GetJointPositions positions={query.data.values} />
		{/if}
	</Query>
</ApiSection>
