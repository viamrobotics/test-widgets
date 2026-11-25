<script lang="ts">
	import type { Detection } from '@viamrobotics/sdk'

	import { formatNumeric } from '$lib/format'

	interface Props {
		detections: Detection[]
	}

	const { detections }: Props = $props()

	const MISSING_VALUE = '-'
	const PERCENT = 100
	const CONFIDENCE_DECIMALS = 2

	const formatBox = ({ xMin, yMin, xMax, yMax }: Detection): string | undefined => {
		if (xMin === undefined || yMin === undefined || xMax === undefined || yMax === undefined) {
			return undefined
		}
		return `(${xMin.toString()}, ${yMin.toString()}) to (${xMax.toString()}, ${yMax.toString()})`
	}

	const id = $props.id()
</script>

{#if detections.length === 0}
	<div
		role="group"
		aria-label="Detections"
		class="flex min-w-0 items-center gap-2"
	>
		<span class="text-subtle-1 w-31 shrink-0 truncate text-xs">Detections</span>
		<span class="readout font-roboto-mono">
			<span class="readout-value">{MISSING_VALUE}</span>
		</span>
	</div>
{:else}
	<ul
		aria-label="Detections"
		class="flex flex-col gap-2"
	>
		{#each detections as detection, index (`${index.toString()}:${detection.className}`)}
			{@const box = formatBox(detection)}
			<li class="flex min-w-0 flex-col gap-0.5">
				<div class="flex min-w-0 items-center gap-2">
					<span
						id="{id}-{index}"
						class="text-subtle-1 w-31 shrink-0 truncate text-xs"
						title={detection.className}
					>
						{detection.className}
					</span>
					<span
						role="group"
						aria-labelledby="{id}-{index}"
						class="readout font-roboto-mono"
					>
						<span class="readout-value">
							{formatNumeric(detection.confidence * PERCENT, CONFIDENCE_DECIMALS)}
						</span>
						<span class="readout-suffix">%</span>
					</span>
				</div>
				{#if box !== undefined}
					<p class="text-subtle-2 text-xs">{box}</p>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
