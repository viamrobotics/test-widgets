<script lang="ts">
	import { SlamClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { createRefetchIntervalStore } from '#lib/components/refetch-interval-store.svelte.js'
	import RefetchController from '#lib/components/RefetchController.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import Position from './Position.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'slam/getPosition'
	)

	const client = createResourceClient(
		SlamClient,
		() => partID,
		() => resourceName
	)

	const query = createResourceQuery(client, 'getPosition', () => ({
		refetchInterval: refetchInterval.current,
	}))
</script>

<ApiSection
	method="GetPosition"
	api={ResourceTriplets.Slam}
	queries={[query]}
	class="grow flex-col gap-4"
>
	{#if query.data !== undefined}
		<Position position={query.data} />
	{/if}
	<div class="mt-auto">
		<RefetchController
			{refetchInterval}
			queries={[query]}
		/>
	</div>
</ApiSection>
