<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Icon } from '@viamrobotics/prime-core'
	import { Progress } from '@viamrobotics/prime-ui'
	import { MachineConnectionEvent } from '@viamrobotics/sdk'
	import { useConnectionStatus } from '@viamrobotics/svelte-sdk'

	import Boundary from './boundary.svelte'

	interface Props {
		partID: string
		connected: Snippet
		dialing?: Snippet
		connecting?: Snippet
		reconnecting?: Snippet
		reconnectionFailed?: Snippet
		disconnecting?: Snippet
		disconnected?: Snippet
	}

	const {
		partID,
		connected,
		dialing,
		connecting,
		reconnecting,
		reconnectionFailed,
		disconnecting,
		disconnected,
	}: Props = $props()

	const connectionStatus = useConnectionStatus(() => partID)

	const views: Record<MachineConnectionEvent, Snippet> = $derived({
		[MachineConnectionEvent.CONNECTED]: connected,
		[MachineConnectionEvent.DIALING]: dialing ?? loader,
		[MachineConnectionEvent.CONNECTING]: connecting ?? loader,
		[MachineConnectionEvent.RECONNECTING]: reconnecting ?? loader,
		[MachineConnectionEvent.RECONNECTION_FAILED]: reconnectionFailed ?? failed,
		[MachineConnectionEvent.DISCONNECTING]: disconnecting ?? loader,
		[MachineConnectionEvent.DISCONNECTED]: disconnected ?? offline,
	})

	const view = $derived(views[connectionStatus.current ?? MachineConnectionEvent.DISCONNECTED])
</script>

{#snippet loader()}
	<div
		class="bg-extralight text-subtle-2 flex h-full min-h-40 w-full flex-wrap items-center justify-center gap-2 px-4 text-center"
	>
		<Progress
			label="Connection status"
			class="w-24 shrink-0"
		/>
		<div class="capitalize">{connectionStatus.current}...</div>
	</div>
{/snippet}

{#snippet failed()}
	<div
		class="bg-extralight text-subtle-2 flex h-full min-h-40 w-full flex-wrap items-center justify-center gap-2 px-4 text-center"
	>
		<Icon
			name="alert"
			cx="text-danger-dark"
			aria-hidden="true"
		/>

		Could not connect to the machine.
	</div>
{/snippet}

{#snippet offline()}
	<div
		class="bg-extralight text-subtle-2 flex h-full min-h-40 w-full items-center justify-center px-4 text-center"
	>
		This machine is offline
	</div>
{/snippet}

{#key connectionStatus.current}
	<!-- fallback outer boundary -->
	<Boundary>
		{@render view()}
	</Boundary>
{/key}
