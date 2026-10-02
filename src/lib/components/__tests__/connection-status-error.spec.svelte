<script lang="ts">
	import ConnectionStatus from '../connection-status.svelte'

	const throwError = (): string => {
		throw new Error('bad news bears')
	}
</script>

<ConnectionStatus partID="error-part-id">
	{#snippet connected()}
		{@const message = throwError()}
		<div>{message}</div>
	{/snippet}
</ConnectionStatus>
