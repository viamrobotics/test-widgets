<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import SetPower from './set-power.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		MotorClient,
		() => partID,
		() => resourceName
	)

	const setPowerMutation = createResourceMutation(client, 'setPower')

	const setPower = (val: number) => setPowerMutation.mutate([val], {})
</script>

<ApiSection
	class="flex-row flex-wrap gap-2"
	method="SetPower"
	api={ResourceTriplets.Motor}
	lastError={setPowerMutation.error}
>
	<div class="flex grow flex-wrap justify-between gap-2">
		<SetPower {setPower} />
	</div>
</ApiSection>
