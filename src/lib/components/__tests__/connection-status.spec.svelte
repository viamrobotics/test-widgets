<script lang="ts">
	import { MachineConnectionEvent } from '@viamrobotics/sdk';

	import ConnectionStatus from '../connection-status.svelte';

	interface Props {
		partID: string;
		status: MachineConnectionEvent;
	}

	const { partID, status }: Props = $props();
</script>

<ConnectionStatus
	{partID}
	{status}
>
	{#snippet connected()}
		<div>connected</div>
	{/snippet}
</ConnectionStatus>
