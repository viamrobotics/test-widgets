<script lang="ts">
	import { BaseClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useBaseState } from './base-state.svelte'
	import MoveStraight from './MoveStraight.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		BaseClient,
		() => partID,
		() => resourceName
	)

	const moveStraightMutation = createResourceMutation(client, 'moveStraight')

	const { motion } = untrack(() => useBaseState(partID, resourceName))

	const moveStraight = (distanceMm: number, mmPerSec: number) => {
		void motion.run(() => moveStraightMutation.mutateAsync([distanceMm, mmPerSec]))
	}
</script>

<ApiSection
	class="flex-row flex-wrap gap-2"
	method="MoveStraight"
	api={ResourceTriplets.Base}
	mutations={[moveStraightMutation]}
>
	<div class="flex grow flex-wrap justify-between gap-2">
		<MoveStraight
			{moveStraight}
			isBusy={motion.isBusy}
		/>
	</div>
</ApiSection>
