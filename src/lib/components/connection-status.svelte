<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Progress } from '@viamrobotics/prime-core'
	import { MachineConnectionEvent } from '@viamrobotics/sdk'
	import { useConnectionStatus } from '@viamrobotics/svelte-sdk'
	import { twMerge } from 'tailwind-merge'

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

	let isErrorExpanded = $state(false)
</script>

<svelte:boundary>
	{#if currentStatus === MachineConnectionEvent.CONNECTED}
		{@render connected?.()}
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

	{#snippet failed(error, reset)}
		<div class="bg-extralight flex h-full w-full flex-col items-center justify-center gap-2 p-4">
			<div>Something went wrong</div>
			<button
				class="text-disabled text-xs hover:underline"
				onclick={reset}>Try again</button
			>
			<button
				class="text-disabled text-xs hover:underline"
				onclick={() => {
					isErrorExpanded = !isErrorExpanded
				}}>{isErrorExpanded ? 'Hide' : 'Show'} error</button
			>
			{#if isErrorExpanded}
				<pre class="font-mono text-xs text-wrap">{error}</pre>
			{/if}
		</div>
	{/snippet}
</svelte:boundary>
