<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import MutationView from '$lib/components/mutation-view.svelte'

	import QuickMove from './quick-move.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		MotorClient,
		() => partID,
		() => resourceName
	)

	const quickSetPowerMutation = createResourceMutation(client, 'setPower')
</script>

<MutationView lastError={quickSetPowerMutation.error}>
	<QuickMove
		setPower={(val) => {
			quickSetPowerMutation.mutate([val], {})
		}}
	/>
</MutationView>
