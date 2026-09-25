<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Progress } from '@viamrobotics/prime-core'
	import { MachineConnectionEvent } from '@viamrobotics/sdk'
	import { useConnectionStatus } from '@viamrobotics/svelte-sdk'
	import { twMerge } from 'tailwind-merge'

	import Boundary from './boundary.svelte'

	interface Props {
		partID: string
		connectingClass?: string
		disconnectedClass?: string
		status?: MachineConnectionEvent
		connected?: Snippet
		connecting?: Snippet
		disconnected?: Snippet
	}

	const {
		partID,
		connectingClass = '',
		disconnectedClass = '',
		status,
		connected,
		connecting,
		disconnected,
	}: Props = $props()

	const connectionStatus = useConnectionStatus(() => partID)
	const currentStatus = $derived(status ?? connectionStatus.current)
</script>

{#if currentStatus === MachineConnectionEvent.CONNECTED}
	<!-- fallback outer boundary -->
	<Boundary children={connected} />
{:else if currentStatus === MachineConnectionEvent.CONNECTING}
	{#if connecting}
		{@render connecting()}
	{:else}
		<div
			class={twMerge(
				'bg-extralight text-disabled flex h-full min-h-40 w-full items-center justify-center gap-2',
				connectingClass
			)}
		>
			<Progress />
			<div class="capitalize">{currentStatus}...</div>
		</div>
	{/if}
{:else if currentStatus === MachineConnectionEvent.DISCONNECTED}
	{#if disconnected}
		{@render disconnected()}
	{:else}
		<div
			class={twMerge(
				'bg-extralight text-disabled flex h-full min-h-40 w-full items-center justify-center',
				disconnectedClass
			)}
		>
			This machine is offline
		</div>
	{/if}
{/if}
