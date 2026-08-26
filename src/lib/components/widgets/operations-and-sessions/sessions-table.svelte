<script lang="ts">
	import { robotApi } from '@viamrobotics/sdk'

	interface Props {
		sessions: robotApi.Session[]
		ourSessionId: string | undefined
	}

	const { sessions, ourSessionId }: Props = $props()

	const sessionTypeToString = (type: robotApi.PeerConnectionType | undefined) => {
		switch (type) {
			case robotApi.PeerConnectionType.GRPC: {
				return 'gRPC'
			}
			case robotApi.PeerConnectionType.WEBRTC: {
				return 'WebRTC'
			}
			default: {
				return 'Unknown'
			}
		}
	}
	// sort sessions by id (because the api returns them in a random order)
	const flattenedSessions = $derived(
		sessions
			.map((session) => ({
				id: session.id,
				type: session.peerConnectionInfo?.type,
				typeString: sessionTypeToString(session.peerConnectionInfo?.type),
				remoteAddress: session.peerConnectionInfo?.remoteAddress,
				localAddress: session.peerConnectionInfo?.localAddress,
			}))
			.toSorted((a, b) => a.id.localeCompare(b.id))
	)
</script>

{#if flattenedSessions.length === 0}
	<p class="text-subtle-2 text-xs">No sessions currently available</p>
{:else}
	<!-- Scroll region: keyboard users need focus on the wrapper to scroll the overflow (WCAG 2.1.1). -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class="overflow-x-auto"
		role="region"
		aria-label="Sessions"
		tabindex="0"
	>
		<table class="w-full min-w-md table-fixed">
			<thead>
				<tr class="bg-light text-subtle-1 border text-left text-xs">
					<th class="w-1/4 p-2 font-normal">ID</th>
					<th class="w-1/8 p-2 font-normal">Type</th>
					<th class="w-1/4 p-2 font-normal">Remote Address</th>
					<th class="w-1/4 p-2 font-normal">Local Address</th>
				</tr>
			</thead>
			<tbody class="text-xs">
				{#each flattenedSessions as session (session.id)}
					<tr class="border border-b text-left">
						<td
							class="truncate p-2 text-left"
							title={session.id}
						>
							{session.id}
							{#if session.id === ourSessionId}
								<div class="text-subtle-2 text-xs">(Ours)</div>
							{/if}
						</td>
						<td class="truncate p-2">{session.typeString}</td>
						<td
							class="truncate p-2"
							title={session.remoteAddress}
							>{session.remoteAddress}
						</td>
						<td
							class="truncate p-2"
							title={session.localAddress}
						>
							{session.localAddress}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
