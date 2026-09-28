<script lang="ts">
	import { ServoClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import Query from '$lib/components/query.svelte'
	import { formatNumeric } from '$lib/format'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		ServoClient,
		() => partID,
		() => resourceName
	)

	const positionQuery = createResourceQuery(client, 'getPosition', {
		refetchInterval: 500,
	})
</script>

<ApiSection
	method="GetPosition"
	api={ResourceTriplets.Servo}
	class="flex-col gap-4"
>
	{#snippet description()}Updates automatically{/snippet}
	<Query query={positionQuery}>
		{#if positionQuery.data !== undefined}
			<!-- span required to get unit closer to position reading -->
			<span class="flex flex-row gap-1">
				<span class="font-roboto-mono font-normal">{formatNumeric(positionQuery.data)}</span>
				<abbr class="text-subtle-2">º</abbr>
			</span>
		{/if}
	</Query>
</ApiSection>
