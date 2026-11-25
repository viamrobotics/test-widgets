<script lang="ts">
	import { BaseClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useBaseState } from './base-state.svelte'
	import Spin from './Spin.svelte'

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

	const spinMutation = createResourceMutation(client, 'spin')
	const { motion } = untrack(() => useBaseState(partID, resourceName))
</script>

<ApiSection
	class="flex-row flex-wrap gap-2"
	method="Spin"
	api={ResourceTriplets.Base}
	mutations={[spinMutation]}
>
	<div class="flex grow flex-wrap justify-between gap-2">
		<Spin
			spin={(angleDeg: number, degsPerSec: number) => {
				void motion.run(() => spinMutation.mutateAsync([angleDeg, degsPerSec]))
			}}
			isBusy={motion.isBusy}
		/>
	</div>
</ApiSection>
