<script lang="ts">
	import { formatNumeric } from '$lib/format'

	interface Props {
		positions: number[]
		lengths: number[]
	}

	const { positions, lengths }: Props = $props()

	const axisCount = $derived(Math.max(positions.length, lengths.length))

	const labelId = $props.id()

	/** An axis draws a track only when it reports a usable length. */
	const trackLength = (index: number) => {
		const length = lengths[index]
		return length !== undefined && Number.isFinite(length) && length > 0 ? length : undefined
	}

	/** Where the position sits on its track, as a percent, held inside the track. */
	const markerPercent = (position: number | undefined, length: number) => {
		if (position === undefined || !Number.isFinite(position)) return 0
		return Math.min(100, Math.max(0, (position / length) * 100))
	}
</script>

<div
	role="group"
	aria-label="Axis positions"
	class="flex min-w-0 flex-col gap-3"
>
	{#each { length: axisCount }, index (index)}
		{@const length = trackLength(index)}
		<div class="flex min-w-0 flex-col gap-1">
			<div class="flex min-w-0 items-center gap-2">
				<span
					id="{labelId}-{index}"
					class="text-subtle-1 w-14 shrink-0 text-xs">Axis {index}</span
				>
				<span
					role="group"
					class="readout font-roboto-mono"
					aria-labelledby="{labelId}-{index}"
				>
					<span class="readout-value">{formatNumeric(positions[index])}</span>
					<span class="readout-suffix">mm</span>
				</span>
			</div>
			{#if length !== undefined}
				<!-- A static indicator of the position between 0 and the axis length, never a progress bar. -->
				<div
					aria-hidden="true"
					class="bg-gray-3 relative mt-1 h-1 rounded-xs"
				>
					<span
						class="bg-gray-8 absolute -top-0.5 h-2 w-0.5"
						style:left="calc({markerPercent(positions[index], length)}% - 1px)"
					></span>
				</div>
				<p class="text-subtle-2 text-xs">Length {formatNumeric(length)} mm</p>
			{/if}
		</div>
	{/each}
</div>
