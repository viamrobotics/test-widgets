<script lang="ts">
	import type { ClassValue } from 'svelte/elements'

	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Grab from './grab.svelte'

	interface Props {
		partID: string
		resourceName: string
		class?: ClassValue
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
	method="Grab"
	api={ResourceTriplets.Gripper}
	class={['flex-col gap-4', className]}
	lastError={grabMutation.error}
>
	<Grab
		onGrab={() => {
			grabMutation.mutate([], {})
		}}
	/>
</ApiSection>
