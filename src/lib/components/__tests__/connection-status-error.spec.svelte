<script lang="ts">
	import { MachineConnectionEvent } from '@viamrobotics/sdk'

	import ConnectionStatus from '../connection-status.svelte'

	const throwError = (): string => {
		throw new Error('bad news bears')
	}
</script>

<ConnectionStatus
	partID="error-part-id"
	status={MachineConnectionEvent.CONNECTED}
>
	{#snippet connected()}
		{@const foo = throwError()}
		<div>
			{foo}
		</div>
	{/snippet}
</ConnectionStatus>
