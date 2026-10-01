<script lang="ts">
	import ConnectionStatus from '../connection-status.svelte'

	interface Props {
		partID: string
	}

	const { partID }: Props = $props()
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div>connected</div>
	{/snippet}
</ConnectionStatus>
