<script lang="ts">
	import { Tooltip } from '@viamrobotics/prime-ui'
	import { robotApi } from '@viamrobotics/sdk'

	import { formatNumeric } from '$lib/format'

	interface Props {
		operations: robotApi.Operation[]
		cancelOperation: (id: string) => void
	}

	const { operations, cancelOperation }: Props = $props()

	const getElapsedTimeMs = (startedAt: { seconds: bigint; nanos: number } | undefined): number => {
		const now = new Date()
		const started = startedAt
			? new Date(Number(startedAt.seconds) * 1000 + startedAt.nanos / 1_000_000)
			: new Date()
		return now.getTime() - started.getTime()
	}

	// sort operations by elapsed time in descending order
	// so that short-lived operations dont result in excessive element-shifting
	const formattedOperations = $derived(
		operations
			.map((operation) => ({
				...operation,
				elapsedTime: getElapsedTimeMs(operation.started),
			}))
			.toSorted((a, b) => b.elapsedTime - a.elapsedTime)
	)
</script>

{#snippet kill(operation: { id: string })}
	<Tooltip>
		<Tooltip.Trigger>
			<button
				type="button"
				class="button button-xs"
				onclick={() => cancelOperation(operation.id)}
			>
				Kill
			</button>
		</Tooltip.Trigger>
		<Tooltip.Content>Request cancellation of the operation.</Tooltip.Content>
	</Tooltip>
{/snippet}

{#snippet elapsed(ms: number)}
	<span class="readout font-roboto-mono">
		<span class="readout-value">{formatNumeric(ms, 0)}</span>
		<span class="readout-suffix">ms</span>
	</span>
{/snippet}

{#if formattedOperations.length === 0}
	<p class="text-subtle-2 text-xs">No operations currently available</p>
{:else}
	<div class="@container min-w-0">
		<ul
			class="divide-light flex flex-col divide-y @2xl:hidden"
			aria-label="Operations"
		>
			{#each formattedOperations as operation (operation.id)}
				<li class="flex min-w-0 flex-col gap-1 py-2">
					<div class="flex items-start justify-between gap-2">
						<span class="font-roboto-mono min-w-0 text-xs break-all">{operation.method}</span>
						{@render kill(operation)}
					</div>
					{@render elapsed(operation.elapsedTime)}
					<span
						class="text-subtle-2 truncate text-xs"
						title={operation.sessionId}
					>
						Session {operation.sessionId}
					</span>
					<span
						class="text-subtle-2 truncate text-xs"
						title={operation.id}
					>
						Operation {operation.id}
					</span>
				</li>
			{/each}
		</ul>
		<table class="hidden w-full table-fixed @2xl:table">
			<thead>
				<tr class="bg-light text-subtle-1 text-left text-xs">
					<th class="w-1/4 p-2 font-normal">ID</th>
					<th class="w-1/4 p-2 font-normal">Session</th>
					<th class="w-1/4 p-2 font-normal">Method</th>
					<th class="w-1/6 p-2 font-normal">Elapsed time</th>
					<th class="w-16"><span class="sr-only">Actions</span></th>
				</tr>
			</thead>
			<tbody class="text-xs">
				{#each formattedOperations as operation (operation.id)}
					<tr class="border-light border-b text-left">
						<td
							class="truncate p-2"
							title={operation.id}
							>{operation.id}
						</td>
						<td
							class="truncate p-2"
							title={operation.sessionId}
							>{operation.sessionId}
						</td>
						<td
							class="font-roboto-mono truncate p-2"
							title={operation.method}
							>{operation.method}
						</td>
						<td class="truncate p-2">{@render elapsed(operation.elapsedTime)}</td>
						<td class="p-2">{@render kill(operation)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
