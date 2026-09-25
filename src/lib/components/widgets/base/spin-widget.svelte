<script lang="ts">
	import { BaseClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import MutationSection from '$lib/components/mutation-section.svelte'
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

<MutationSection
	title="Spin"
	api={ResourceTriplets.Base}
	description="Turn to a given angle at a given velocity"
	lastError={spinMutation.error}
>
	<Spin
		spin={(angleDeg: number, degsPerSec: number) => {
			spinMutation.mutate([angleDeg, degsPerSec], {})
		}}
	/>
</MutationSection>
