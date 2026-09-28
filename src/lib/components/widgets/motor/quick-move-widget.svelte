<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import QuickMove from './quick-move.svelte'

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

	const quickSetPowerMutation = createResourceMutation(client, 'setPower')
</script>

<ApiSection
	class="flex-row flex-wrap gap-2"
	method="SetPower"
	api={ResourceTriplets.Motor}
	lastError={quickSetPowerMutation.error}
>
	<div class="flex grow flex-wrap justify-between gap-2">
		<QuickMove
			setPower={(val) => {
				quickSetPowerMutation.mutate([val], {})
			}}
		/>
	</div>
</ApiSection>
