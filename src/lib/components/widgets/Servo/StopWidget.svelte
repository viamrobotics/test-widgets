<script lang="ts">
	import { ServoClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import StopButton from '#lib/components/StopButton.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useServoState } from './servo-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		ServoClient,
		() => partID,
		() => resourceName
	)

	const stopMutation = createResourceMutation(client, 'stop')

	const { commanded } = untrack(() => useServoState(partID, resourceName))

	// Stop is in no group, so it always sends. A stopped servo is not at its commanded angle, so
	// QuickMove's next step starts from the read position.
	const stop = () => {
		commanded.degrees = undefined
		stopMutation.mutate([])
	}
</script>

<ApiSection
	class="grow flex-col gap-4"
	method="Stop"
	api={ResourceTriplets.Servo}
	mutations={[stopMutation]}
>
	<StopButton onStop={stop} />
</ApiSection>
