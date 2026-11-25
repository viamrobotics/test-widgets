<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import GoFor from './go-for.svelte'
	import { useMotorState } from './motor-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		MotorClient,
		() => partID,
		() => resourceName
	)

	const goForMutation = createResourceMutation(client, 'goFor')
	const { motion } = untrack(() => useMotorState(partID, resourceName))
</script>

<ApiSection
	class="flex-row flex-wrap gap-2"
	method="GoFor"
	api={ResourceTriplets.Motor}
	mutations={[goForMutation]}
>
	<div class="flex grow flex-wrap justify-between gap-2">
		<GoFor
			goFor={(rpm: number, revolutions: number) => {
				void motion.run(() => goForMutation.mutateAsync([rpm, revolutions]))
			}}
			isBusy={motion.isBusy}
		/>
	</div>
</ApiSection>
