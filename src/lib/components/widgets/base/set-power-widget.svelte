<script lang="ts">
	import { BaseClient, type Vector3 } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import MutationSection from '$lib/components/mutation-section.svelte'
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

<MutationSection
	title="SetPower"
	api={ResourceTriplets.Base}
	description="Move continuously at a given amount of power"
	lastError={setPowerMutation.error}
>
	<SetPower
		setPower={(linear: Vector3, angular: Vector3) => {
			setPowerMutation.mutate([linear, angular], {})
		}}
	/>
</MutationSection>
