<script lang="ts">
	import { GantryClient } from '@viamrobotics/sdk'

	import IsMoving from '$lib/components/is-moving.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<IsMoving
	client={GantryClient}
	api={ResourceTriplets.Gantry}
	{partID}
	{resourceName}
/>
