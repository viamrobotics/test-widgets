<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'

	import ErrorDisplay from '$lib/components/error.svelte'
	import Table from '$lib/components/table.svelte'

	interface Props {
		positions: number[]
		moveToJointPositions: (jointPositions: number[]) => void
		lastError: Error | null
	}

	const { positions, moveToJointPositions, lastError }: Props = $props()

	const quickMove = (index: number, increment: number) => {
		const clonedPositions = positions.map((position, positionIndex) =>
			positionIndex === index ? position + increment : position
		)
		moveToJointPositions(clonedPositions)
	}
</script>

<Table>
	<thead>
		<tr>
			<th> Joint </th>
			<th> Move (degrees) </th>
		</tr>
	</thead>
	<tbody>
		{#each positions, index}
			<tr>
				<th> {index} </th>
				<th>
					<div class="flex h-full max-h-6.5 gap-1.5">
						<Button
							aria-label="minus-five-degrees"
							class="px-2.5!"
							onclick={() => quickMove(index, -5)}
						>
							<span class="flex gap-1 text-xs">
								<span class="text-subtle-2">-</span>
								<span>5</span>
							</span>
						</Button>
						<Button
							aria-label="plus-five-degrees"
							class="px-2.5!"
							onclick={() => quickMove(index, 5)}
						>
							<span class="flex gap-1 text-xs">
								<span class="text-subtle-2">+</span>
								<span>5</span>
							</span>
						</Button>
					</div>
				</th>
			</tr>
		{/each}
	</tbody>
</Table>
<ErrorDisplay {lastError} />
