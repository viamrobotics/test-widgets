<script lang="ts">
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import { Section } from '$lib/components/section'

	import Grab from './grab.svelte'

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

<Grab onGrab={() => grabMutation.mutate([], {})} />
<Section.Error error={grabMutation.error} />
