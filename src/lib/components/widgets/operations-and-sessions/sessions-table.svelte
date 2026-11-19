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
	<div class="@container min-w-0">
		<ul
			class="divide-light flex flex-col divide-y @2xl:hidden"
			aria-label="Sessions"
		>
			{#each flattenedSessions as session (session.id)}
				<li class="flex min-w-0 flex-col gap-1 py-2">
					<div class="flex min-w-0 items-center gap-2">
						<span
							class="min-w-0 truncate text-xs"
							title={session.id}
						>
							{session.id}
						</span>
						{#if session.id === ourSessionId}
							<span class="badge badge-neutral shrink-0">Ours</span>
						{/if}
					</div>
					<span class="text-xs">{session.typeString}</span>
					<span
						class="text-subtle-2 truncate text-xs"
						title={session.remoteAddress}
					>
						Remote {session.remoteAddress}
					</span>
					<span
						class="text-subtle-2 truncate text-xs"
						title={session.localAddress}
					>
						Local {session.localAddress}
					</span>
				</li>
			{/each}
		</ul>
		<table class="hidden w-full table-fixed @2xl:table">
			<thead>
				<tr class="bg-light text-subtle-1 text-left text-xs">
					<th class="w-1/4 p-2 font-normal">ID</th>
					<th class="w-1/8 p-2 font-normal">Type</th>
					<th class="w-1/4 p-2 font-normal">Remote address</th>
					<th class="w-1/4 p-2 font-normal">Local address</th>
				</tr>
			</thead>
			<tbody class="text-xs">
				{#each flattenedSessions as session (session.id)}
					<tr class="border-light border-b text-left">
						<td
							class="p-2 text-left"
							title={session.id}
						>
							<div class="flex min-w-0 items-center gap-2">
								<span class="min-w-0 truncate">{session.id}</span>
								{#if session.id === ourSessionId}
									<span class="badge badge-neutral shrink-0">Ours</span>
								{/if}
							</div>
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
