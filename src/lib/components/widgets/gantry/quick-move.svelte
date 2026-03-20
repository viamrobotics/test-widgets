<script lang="ts">
	import { Button } from '@viamrobotics/prime-core';

	import ErrorDisplay from '$lib/components/error-display.svelte';
	import Table from '$lib/components/table.svelte';

	interface Props {
		positions: number[];
		moveTo: (newPos: number[], speeds: number[]) => void;
		lastError: Error | null;
	}

	const { positions, moveTo, lastError }: Props = $props();

	// mm/s
	const quickMoveSpeed = 50;

	const quickMove = (index: number, increment: number) => {
		const clonedPositions = positions.map((position, positionIndex) =>
			positionIndex === index ? position + increment : position
		);
		moveTo(
			clonedPositions,
			Array.from<number>({ length: clonedPositions.length }).fill(quickMoveSpeed)
		);
	};
</script>

<Table>
	<thead>
		<tr>
			<th> Axis </th>
			<th> Move <abbr>(mm)</abbr> </th>
		</tr>
	</thead>
	<tbody>
		{#each positions, index (index)}
			<tr>
				<th> {index} </th>
				<th>
					<div class="flex h-full max-h-6.5 gap-1.5">
						<Button
							aria-label="minus-ten-degrees"
							class="px-2.5!"
							onclick={() => quickMove(index, -10)}
						>
							<span class="flex gap-1 text-xs">
								<span class="text-subtle-2">-</span>
								<span>10</span>
							</span>
						</Button>
						<Button
							aria-label="plus-ten-degrees"
							class="px-2.5!"
							onclick={() => quickMove(index, 10)}
						>
							<span class="flex gap-1 text-xs">
								<span class="text-subtle-2">+</span>
								<span>10</span>
							</span>
						</Button>
					</div>
				</th>
			</tr>
		{/each}
	</tbody>
</Table>

<ErrorDisplay {lastError} />
