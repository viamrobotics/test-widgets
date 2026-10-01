<script lang="ts">
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ErrorDisplay from '$lib/components/error.svelte'

	import Open from './open.svelte'

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

<Open onOpen={() => openMutation.mutate([], {})} />
<ErrorDisplay lastError={openMutation.error} />
