<script lang="ts">
	import { BaseClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
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

<ApiSection
	class="flex-row flex-wrap gap-2"
	method="MoveStraight"
	api={ResourceTriplets.Base}
	lastError={moveStraightMutation.error}
>
	{#snippet subheading()}Move across a given distance at a given velocity{/snippet}
	<div class="flex grow flex-wrap justify-between gap-2">
		<MoveStraight {moveStraight} />
	</div>
</ApiSection>
