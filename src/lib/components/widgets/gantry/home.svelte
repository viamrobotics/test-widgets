<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'
	import { GantryClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import { Section } from '$lib/components/section'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		GantryClient,
		() => partID,
		() => resourceName
	)

	const homeMutation = createResourceMutation(client, 'home')
</script>

<Button
	class="w-fit"
	icon="play-circle-outline"
	onclick={() => {
		homeMutation.mutate([], {})
	}}
>
	Execute
</Button>
<Section.Error error={homeMutation.error} />
