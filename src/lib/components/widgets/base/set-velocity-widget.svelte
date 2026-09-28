<script lang="ts">
	import { BaseClient, type Vector3 } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import SetVelocity from './set-velocity.svelte'

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

	const setVelocityMutation = createResourceMutation(client, 'setVelocity')
</script>

<ApiSection
	class="flex-row flex-wrap gap-2"
	method="SetVelocity"
	api={ResourceTriplets.Base}
	lastError={setVelocityMutation.error}
>
	{#snippet subheading()}Move continually at a given velocity{/snippet}
	<div class="flex grow flex-wrap justify-between gap-2">
		<SetVelocity
			setVelocity={(linear: Vector3, angular: Vector3) => {
				setVelocityMutation.mutate([linear, angular], {})
			}}
		/>
	</div>
</ApiSection>
