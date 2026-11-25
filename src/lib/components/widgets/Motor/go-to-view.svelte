<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import GoTo from './go-to.svelte'
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

	const goToMutation = createResourceMutation(client, 'goTo')
	const { motion } = untrack(() => useMotorState(partID, resourceName))

	const goTo = (rpm: number, pos: number) => {
		void motion.run(() => goToMutation.mutateAsync([rpm, pos]))
	}
</script>

<ApiSection
	class="flex-row flex-wrap gap-2"
	method="GoTo"
	api={ResourceTriplets.Motor}
	mutations={[goToMutation]}
>
	<div class="flex grow flex-wrap justify-between gap-2">
		<GoTo
			{goTo}
			isBusy={motion.isBusy}
		/>
	</div>
</ApiSection>
