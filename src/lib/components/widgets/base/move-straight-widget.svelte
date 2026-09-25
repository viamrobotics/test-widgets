<script lang="ts">
	import { BaseClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import MutationSection from '$lib/components/mutation-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

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

<MutationSection
	title="MoveStraight"
	api={ResourceTriplets.Base}
	description="Move across a given distance at a given velocity"
	lastError={moveStraightMutation.error}
>
	<MoveStraight {moveStraight} />
</MutationSection>
