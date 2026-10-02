<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'
	import { ButtonClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import { Section } from '$lib/components/section'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		ButtonClient,
		() => partID,
		() => resourceName
	)

	const pushMutation = createResourceMutation(client, 'push')
</script>

<Button
	onclick={() => {
		pushMutation.mutate([], {})
	}}
	class="font-roboto-mono w-20 p-3 uppercase"
>
	Push
</Button>
<Section.Error error={pushMutation.error} />
