<script lang="ts">
	import type { ClassValue } from 'svelte/elements'

	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Open from './open.svelte'

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

	const openMutation = createResourceMutation(client, 'open')
</script>

<ApiSection
	method="Open"
	api={ResourceTriplets.Gripper}
	class={['flex-col gap-4', className]}
	lastError={openMutation.error}
>
	<Open
		onOpen={() => {
			openMutation.mutate([], {})
		}}
	/>
</ApiSection>
