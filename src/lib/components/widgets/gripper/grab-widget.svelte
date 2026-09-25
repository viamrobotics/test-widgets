<script lang="ts">
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Grab from './grab.svelte'

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

	const grabMutation = createResourceMutation(client, 'grab')
</script>

<ApiSection
	title="Grab"
	api={ResourceTriplets.Gripper}
	class={className}
>
	<Grab
		onGrab={() => {
			grabMutation.mutate([], {})
		}}
		lastError={grabMutation.error}
	/>
</ApiSection>
