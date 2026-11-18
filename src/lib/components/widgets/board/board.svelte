<script lang="ts">
	import ConnectionStatus from '$lib/components/connection-status.svelte'

	import ReadWritePins from './read-write-pins.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<ReadWritePins
			{partID}
			{resourceName}
		/>
	{/snippet}
</ConnectionStatus>
