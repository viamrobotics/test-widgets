<script lang="ts">
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import Grab from './Grab.svelte'

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
</script>

<ApiSection
	method="Grab"
	api={ResourceTriplets.Gripper}
	mutations={[grabMutation]}
	class="grow-0 flex-col gap-3"
>
	<Grab onGrab={() => grabMutation.mutate([], {})} />
</ApiSection>
