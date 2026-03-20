<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import MutationView from '$lib/components/mutation-view.svelte'

	import GoFor from './go-for.svelte'

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

	const goForMutation = createResourceMutation(client, 'goFor')
</script>

<MutationView lastError={goForMutation.error}>
	<GoFor
		goFor={(rpm: number, revolutions: number) => {
			goForMutation.mutate([rpm, revolutions], {})
		}}
	/>
</MutationView>
