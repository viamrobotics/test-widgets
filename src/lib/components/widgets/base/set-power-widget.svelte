<script lang="ts">
	import { BaseClient, type Vector3 } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import MutationView from '$lib/components/mutation-view.svelte'

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

<MutationView lastError={setPowerMutation.error}>
	<SetPower
		setPower={(linear: Vector3, angular: Vector3) => {
			setPowerMutation.mutate([linear, angular], {})
		}}
	/>
</MutationView>
