<script lang="ts">
	import { ServoClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Move from './move.svelte'
	import { useServoState } from './servo-state.svelte'

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
	const moveMutation = createResourceMutation(client, 'move')

	const { motion } = untrack(() => useServoState(partID, resourceName))

	const moveTo = (angle: number) => {
		void motion.run(() => moveMutation.mutateAsync([angle]))
	}
</script>

<ApiSection
	class="grow flex-col gap-4"
	method="Move"
	api={ResourceTriplets.Servo}
	queries={[positionQuery]}
	mutations={[moveMutation]}
>
	{#if positionQuery.data !== undefined}
		<Move
			currentPosition={positionQuery.data}
			{moveTo}
			isBusy={motion.isBusy}
		/>
	{/if}
</ApiSection>
