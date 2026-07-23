<script lang="ts">
	import { useResourceNames } from '@viamrobotics/svelte-sdk'

	import DoCommand from './do-command.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	// DoCommand needs the full ResourceName (its client class is chosen by subtype),
	// so resolve it from the machine's resource names by matching the string name.
	const resourceNames = useResourceNames(() => partID)
	const resource = $derived(
		resourceNames.current.find((candidate) => candidate.name === resourceName)
	)
</script>

{#if resource}
	<DoCommand
		{partID}
		{resource}
	/>
{/if}
