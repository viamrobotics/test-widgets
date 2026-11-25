<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import GoFor from './GoFor.svelte'

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

	const goForMutation = createResourceMutation(client, 'goFor')
</script>

<ApiSection
	class="flex-row flex-wrap gap-2"
	method="GoFor"
	api={ResourceTriplets.Motor}
	mutations={[goForMutation]}
>
	<div class="flex grow flex-wrap justify-between gap-2">
		<GoFor
			goFor={(rpm: number, revolutions: number) => {
				goForMutation.mutate([rpm, revolutions], {})
			}}
		/>
	</div>
</ApiSection>
