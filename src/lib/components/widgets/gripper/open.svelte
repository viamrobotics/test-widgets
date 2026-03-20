<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ErrorDisplay from '$lib/components/error-display.svelte'

	import OpenGripperSvg from './open-gripper-svg.svelte'

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

<Button
	onclick={() => {
		openMutation.mutate([], {})
	}}
	class="w-20 p-3 py-3"
>
	<div class="flex flex-col gap-2">
		<OpenGripperSvg />
		<p class="font-roboto-mono text-xs uppercase">open</p>
	</div>
</Button>
<ErrorDisplay lastError={openMutation.error} />
