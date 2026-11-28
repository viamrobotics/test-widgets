<script lang="ts">
	import { ServoClient } from '@viamrobotics/sdk'
	import Stop from '#lib/components/Stop.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<Stop
	client={ServoClient}
	api={ResourceTriplets.Servo}
	{partID}
	{resourceName}
/>
