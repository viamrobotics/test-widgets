<script lang="ts">
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Open from './open.svelte'

	interface Props {
		partID: string
		resourceName: string
		class?: string
	}

	const { partID, resourceName, class: className }: Props = $props()

	const client = createResourceClient(
		GripperClient,
		() => partID,
		() => resourceName
	)

	const openMutation = createResourceMutation(client, 'open')
</script>

<ApiSection
	title="Open"
	api={ResourceTriplets.Gripper}
	class={className}
>
	<Open
		onOpen={() => {
			openMutation.mutate([], {})
		}}
		lastError={openMutation.error}
	/>
</ApiSection>
