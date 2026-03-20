<script lang="ts">
	import { BaseClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import MutationView from '$lib/components/mutation-view.svelte'

	import MoveStraight from './move-straight.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		BaseClient,
		() => partID,
		() => resourceName
	)

	const moveStraightMutation = createResourceMutation(client, 'moveStraight')

	const moveStraight = (distanceMm: number, mmPerSec: number) => {
		moveStraightMutation.mutate([distanceMm, mmPerSec])
	}
</script>

<MutationView lastError={moveStraightMutation.error}>
	<MoveStraight {moveStraight} />
</MutationView>
