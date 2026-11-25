<script lang="ts">
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

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
</script>

<ApiSection
	method="Open"
	api={ResourceTriplets.Gripper}
	mutations={[openMutation]}
	class="grow-0 flex-col gap-3"
>
	<Open onOpen={() => openMutation.mutate([], {})} />
</ApiSection>
