<script lang="ts">
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { useGripperState } from './gripper-state.svelte'
	import Open from './open.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		GripperClient,
		() => partID,
		() => resourceName
	)

	const openMutation = createResourceMutation(client, 'open')
	const { motion } = untrack(() => useGripperState(partID, resourceName))
</script>

<ApiSection
	method="Open"
	api={ResourceTriplets.Gripper}
	mutations={[openMutation]}
	class="grow-0 flex-col gap-3"
>
	<Open
		onOpen={() => {
			void motion.run(() => openMutation.mutateAsync([]))
		}}
		isBusy={motion.isBusy}
	/>
</ApiSection>
