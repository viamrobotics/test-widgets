<script lang="ts">
	import { GantryClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import MoveToPosition from './MoveToPosition.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		GantryClient,
		() => partID,
		() => resourceName
	)

	const positionQuery = createResourceQuery(client, 'getPosition', {
		refetchInterval: 500,
	})
	const moveMutation = createResourceMutation(client, 'moveToPosition')
</script>

<ApiSection
	class="grow flex-col gap-4"
	method="MoveToPosition"
	api={ResourceTriplets.Gantry}
	queries={[positionQuery]}
	mutations={[moveMutation]}
>
	{#if positionQuery.data !== undefined}
		<MoveToPosition
			positions={positionQuery.data}
			moveTo={(newPos: number[], speeds: number[]) => {
				moveMutation.mutate([newPos, speeds], {})
			}}
		/>
	{/if}
</ApiSection>
