<script lang="ts">
	import { BaseClient, type Vector3 } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useBaseState } from './base-state.svelte'
	import SetVelocity from './SetVelocity.svelte'

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

	const setVelocityMutation = createResourceMutation(client, 'setVelocity')
	const { motion } = untrack(() => useBaseState(partID, resourceName))
</script>

<ApiSection
	class="flex-row flex-wrap gap-2"
	method="SetVelocity"
	api={ResourceTriplets.Base}
	mutations={[setVelocityMutation]}
>
	<div class="flex grow flex-wrap justify-between gap-2">
		<SetVelocity
			setVelocity={(linear: Vector3, angular: Vector3) => {
				void motion.run(() => setVelocityMutation.mutateAsync([linear, angular]))
			}}
			isBusy={motion.isBusy}
		/>
	</div>
</ApiSection>
