<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import StopButton from '#lib/components/StopButton.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useArmState } from './arm-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		ArmClient,
		() => partID,
		() => resourceName
	)

	const stopMutation = createResourceMutation(client, 'stop')

	const { holdCancel } = untrack(() => useArmState(partID, resourceName))

	// Stop is in no group, so it always sends. It ends Jog's and Joints' holds first, so no further segment goes out.
	const stop = () => {
		holdCancel.raise()
		stopMutation.mutate([])
	}
</script>

<ApiSection
	class="grow flex-col gap-4"
	method="Stop"
	api={ResourceTriplets.Arm}
	mutations={[stopMutation]}
>
	<StopButton onStop={stop} />
</ApiSection>
