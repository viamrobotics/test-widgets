<script lang="ts">
	import { BaseClient, type Vector3 } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import MutationSection from '$lib/components/mutation-section.svelte'
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

<MutationSection
	title="SetVelocity"
	api={ResourceTriplets.Base}
	description="Move continually at a given velocity"
	lastError={setVelocityMutation.error}
>
	<SetVelocity
		setVelocity={(linear: Vector3, angular: Vector3) => {
			setVelocityMutation.mutate([linear, angular], {})
		}}
	/>
</MutationSection>
