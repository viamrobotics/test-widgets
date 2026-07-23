<script lang="ts">
	import { useResourceNames } from '@viamrobotics/svelte-sdk'

	import DoCommand from './do-command.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

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
