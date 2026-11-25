<script lang="ts">
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import Grab from './Grab.svelte'
	import { useGripperState } from './gripper-state.svelte'

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

	const grabMutation = createResourceMutation(client, 'grab')
	const { motion } = untrack(() => useGripperState(partID, resourceName))

	let statusText = $state('')

	const grab = async () => {
		const outcome = await motion.run(() => {
			statusText = 'Grabbing'
			return grabMutation.mutateAsync([])
		})
		if (outcome === undefined) return
		statusText = outcome === 'succeeded' ? 'Grab finished' : ''
	}
</script>

<ApiSection
	method="Grab"
	api={ResourceTriplets.Gripper}
	mutations={[grabMutation]}
	class="grow-0 flex-col gap-1"
>
	<div class="flex">
		<Grab
			onGrab={grab}
			isBusy={motion.isBusy}
		/>
	</div>
	<StatusLine text={statusText} />
</ApiSection>
