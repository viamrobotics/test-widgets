<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ErrorDisplay from '$lib/components/error-display.svelte'

	import ClosedGripperSvg from './closed-gripper-svg.svelte'

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

<Button
	onclick={() => {
		grabMutation.mutate([], {})
	}}
	class="w-20 p-3 py-3"
>
	<div class="flex flex-col gap-2">
		<ClosedGripperSvg />
		<p class="font-roboto-mono text-xs uppercase">grab</p>
	</div>
</Button>
<ErrorDisplay lastError={grabMutation.error} />
