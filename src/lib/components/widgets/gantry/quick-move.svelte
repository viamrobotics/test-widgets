<script lang="ts">
	interface Props {
		positions: number[]
		moveTo: (newPos: number[], speeds: number[]) => void
	}

	const { positions, moveTo }: Props = $props()

	// mm/s
	const quickMoveSpeed = 50
	const STEP_MM = 10

	const quickMove = (index: number, increment: number) => {
		const clonedPositions = positions.map((position, positionIndex) =>
			positionIndex === index ? position + increment : position
		)
		moveTo(
			clonedPositions,
			Array.from<number>({ length: clonedPositions.length }).fill(quickMoveSpeed)
		)
	}

	const groupId = $props.id()
</script>

<div
	role="group"
	aria-label="Quick move axes"
	class="flex min-w-0 flex-col gap-1"
>
	{#each [...positions.keys()] as index (index)}
		{@const labelId = `${groupId}-axis-${index}`}
		<div
			role="group"
			aria-labelledby={labelId}
			class="flex items-center gap-2"
		>
			<span
				id={labelId}
				class="text-subtle-1 text-xs"
			>
				Axis {index}
			</span>
			<div class="ml-auto flex gap-2">
				<button
					type="button"
					class="button button-xs"
					aria-label="Axis {index}, −{STEP_MM} mm"
					onclick={() => {
						quickMove(index, -STEP_MM)
					}}
				>
					−{STEP_MM} mm
				</button>
				<button
					type="button"
					class="button button-xs"
					aria-label="Axis {index}, +{STEP_MM} mm"
					onclick={() => {
						quickMove(index, STEP_MM)
					}}
				>
					+{STEP_MM} mm
				</button>
			</div>
		</div>
	{/each}
</div>
