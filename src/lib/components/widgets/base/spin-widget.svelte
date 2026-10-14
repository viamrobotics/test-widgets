<script lang="ts">
	import { BaseClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Spin from './spin.svelte'

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

	const spinMutation = createResourceMutation(client, 'spin')
</script>

<ApiSection
	class="flex-row flex-wrap gap-2"
	method="Spin"
	api={ResourceTriplets.Base}
	mutations={[spinMutation]}
>
	{#snippet subheading()}
		<Section.Text>Turn to a given angle at a given velocity</Section.Text>
	{/snippet}
	<div class="flex grow flex-wrap justify-between gap-2">
		<Spin
			spin={(angleDeg: number, degsPerSec: number) => {
				spinMutation.mutate([angleDeg, degsPerSec], {})
			}}
		/>
	</div>
</ApiSection>
