<script lang="ts">
	import { Button, Tooltip } from '@viamrobotics/prime-core';
	import { robotApi } from '@viamrobotics/sdk';

	import { formatNumeric } from '$lib/format';

	interface Props {
		operations: robotApi.Operation[];
		cancelOperation: (id: string) => void;
	}

	const { operations, cancelOperation }: Props = $props();

	const getElapsedTimeMs = (startedAt: { seconds: bigint; nanos: number } | undefined): number => {
		const now = new Date();
		const started = startedAt
			? new Date(Number(startedAt.seconds) * 1000 + startedAt.nanos / 1_000_000)
			: new Date();
		return now.getTime() - started.getTime();
	};

	// sort operations by elapsed time in descending order
	// so that short-lived operations dont result in excessive element-shifting
	const formattedOperations = $derived(
		operations
			.map((operation) => ({
				...operation,
				elapsedTime: getElapsedTimeMs(operation.started)
			}))
			.toSorted((a, b) => b.elapsedTime - a.elapsedTime)
	);
</script>

{#if formattedOperations.length === 0}
	<p class="text-subtle-2 text-xs">No operations currently available</p>
{:else}
	<table class="w-full table-fixed">
		<thead>
			<tr class="bg-light text-subtle-1 border text-left text-xs">
				<th class="w-1/4 p-2 font-normal">ID</th>
				<th class="w-1/4 p-2 font-normal">Session</th>
				<th class="w-1/4 p-2 font-normal">Method</th>
				<th class="w-1/6 p-2 font-normal">Elapsed Time</th>
				<th class="w-16"></th>
			</tr>
		</thead>
		<tbody class="text-xs">
			{#each formattedOperations as operation (operation.id)}
				<tr class="border border-b text-left">
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
						class="truncate p-2"
						title={operation.method}
						>{operation.method}
					</td>
					<td
						class="truncate p-2"
						title={`${formatNumeric(operation.elapsedTime, 0)} ms`}
					>
						{formatNumeric(operation.elapsedTime, 0)} ms
					</td>
					<td class="p-2">
						<Tooltip hoverDelayMS={500}>
							<Button onclick={() => cancelOperation(operation.id)}>Kill</Button>

							<span slot="description"> Request cancellation of the operation. </span>
						</Tooltip>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
