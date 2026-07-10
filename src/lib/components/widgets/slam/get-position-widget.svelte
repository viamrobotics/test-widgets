<script lang="ts">
	import { SlamClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import Query from '$lib/components/query.svelte'

	import Position from './position.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		SlamClient,
		() => partID,
		() => resourceName
	)

	const query = createResourceQuery(client, 'getPosition', { refetchInterval: 1000 })
</script>

<ApiSection
	title="GetPosition"
	class="grow"
>
	<Query
		{query}
		contentCx="h-6"
	>
		{#if query.data !== undefined}
			<Position position={query.data} />
		{/if}
	</Query>
</ApiSection>
