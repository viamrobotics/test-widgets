<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'
	import { GantryClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		GantryClient,
		() => partID,
		() => resourceName
	)

	const homeMutation = createResourceMutation(client, 'home')
</script>

<ApiSection
	class="grow flex-col gap-4"
	method="Home"
	api={ResourceTriplets.Gantry}
	mutations={[homeMutation]}
>
	{#snippet subheading()}
		<Section.Text>Run the homing sequence</Section.Text>
	{/snippet}
	<Button
		class="w-fit"
		icon="play-circle-outline"
		onclick={() => {
			homeMutation.mutate([], {})
		}}
	>
		Execute
	</Button>
</ApiSection>
