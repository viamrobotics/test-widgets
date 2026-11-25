<script lang="ts">
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useGripperState } from './gripper-state.svelte'
	import Open from './Open.svelte'

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

	let statusText = $state('')

	const open = async () => {
		const outcome = await motion.run(() => {
			statusText = 'Opening'
			return openMutation.mutateAsync([])
		})
		if (outcome === undefined) return
		statusText = outcome === 'succeeded' ? 'Opened' : ''
	}
</script>

<ApiSection
	method="Open"
	api={ResourceTriplets.Gripper}
	mutations={[openMutation]}
	class="grow-0 flex-col gap-1"
>
	<div class="flex">
		<Open
			onOpen={open}
			isBusy={motion.isBusy}
		/>
	</div>
	<StatusLine text={statusText} />
</ApiSection>
