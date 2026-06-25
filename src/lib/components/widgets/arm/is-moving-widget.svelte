<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'

	import IsMoving from '$lib/components/is-moving.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<IsMoving
	client={ArmClient}
	{partID}
	{resourceName}
/>
