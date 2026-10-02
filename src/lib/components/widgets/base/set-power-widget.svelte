<script lang="ts">
	import { BaseClient, type Vector3 } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import SetPower from './set-power.svelte'

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

	const setPowerMutation = createResourceMutation(client, 'setPower')
</script>

<ApiSection
	class="flex-row flex-wrap gap-2"
	method="SetPower"
	api={ResourceTriplets.Base}
	mutations={[setPowerMutation]}
>
	{#snippet subheading()}
		<Section.Text>Move continuously at a given amount of power</Section.Text>
	{/snippet}
	<div class="flex grow flex-wrap justify-between gap-2">
		<SetPower
			setPower={(linear: Vector3, angular: Vector3) => {
				setPowerMutation.mutate([linear, angular], {})
			}}
		/>
	</div>
</ApiSection>
