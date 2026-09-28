<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import GoTo from './go-to.svelte'

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

	const goToMutation = createResourceMutation(client, 'goTo')

	const goTo = (rpm: number, pos: number) => {
		goToMutation.mutate([rpm, pos], {})
	}
</script>

<ApiSection
	class="flex-row flex-wrap gap-2"
	method="GoTo"
	api={ResourceTriplets.Motor}
	lastError={goToMutation.error}
>
	<div class="flex grow flex-wrap justify-between gap-2">
		<GoTo {goTo} />
	</div>
</ApiSection>
