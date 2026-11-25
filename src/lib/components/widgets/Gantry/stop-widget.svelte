<script lang="ts">
	import { GantryClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import ApiSection from '$lib/components/api-section.svelte'
	import StopButton from '$lib/components/stop-button.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { useGantryState } from './gantry-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		GantryClient,
		() => partID,
		() => resourceName
	)

	const stopMutation = createResourceMutation(client, 'stop')

	const { holdCancel } = untrack(() => useGantryState(partID, resourceName))

	// Stop is in no group, so it always sends. It ends QuickMove's hold first, so no further step goes out.
	const stop = () => {
		holdCancel.raise()
		stopMutation.mutate([])
	}
</script>

<ApiSection
	class="grow flex-col gap-4"
	method="Stop"
	api={ResourceTriplets.Gantry}
	mutations={[stopMutation]}
>
	<StopButton onStop={stop} />
</ApiSection>
