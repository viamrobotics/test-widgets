<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import SetRPM from './set-rpm.svelte'

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

	const setRPMMutation = createResourceMutation(client, 'setRPM')

	const setRPM = (val: number) => setRPMMutation.mutate([val], {})
</script>

<ApiSection
	class="flex-row flex-wrap gap-2"
	method="SetRPM"
	api={ResourceTriplets.Motor}
	mutations={[setRPMMutation]}
>
	<div class="flex grow flex-wrap justify-between gap-2">
		<SetRPM {setRPM} />
	</div>
</ApiSection>
