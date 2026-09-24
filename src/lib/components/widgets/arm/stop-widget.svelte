<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'

	import Stop from '$lib/components/stop.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<Stop
	client={ArmClient}
	api={ResourceTriplets.Arm}
	{partID}
	{resourceName}
/>
