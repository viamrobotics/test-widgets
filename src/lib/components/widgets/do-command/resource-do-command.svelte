<script lang="ts">
	import { useResourceStatuses } from '@viamrobotics/svelte-sdk'

	import DoCommand from './do-command.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const statuses = useResourceStatuses(() => partID)
	const resource = $derived(
		statuses.current.find((status) => status.name?.name === resourceName)?.name
	)
</script>

{#if resource}
	<DoCommand
		{partID}
		{resource}
	/>
{/if}
