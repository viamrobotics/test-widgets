<script lang="ts">
	import type { Classification } from '@viamrobotics/sdk'

	import { formatNumeric } from '#lib/format.js'

	interface Props {
		classifications: Classification[]
	}

	const { classifications }: Props = $props()

	const MISSING_VALUE = '-'
	const PERCENT = 100
	const CONFIDENCE_DECIMALS = 2

	const id = $props.id()
</script>

{#if classifications.length === 0}
	<div
		role="group"
		aria-label="Classifications"
		class="flex min-w-0 items-center gap-2"
	>
		<span class="text-subtle-1 w-31 shrink-0 truncate text-xs">Classifications</span>
		<span class="readout font-roboto-mono">
			<span class="readout-value">{MISSING_VALUE}</span>
		</span>
	</div>
{:else}
	<ul
		aria-label="Classifications"
		class="flex flex-col gap-1"
	>
		{#each classifications as classification, index (`${index.toString()}:${classification.className}`)}
			<li class="flex min-w-0 items-center gap-2">
				<span
					id="{id}-{index}"
					class="text-subtle-1 w-31 shrink-0 truncate text-xs"
					title={classification.className}
				>
					{classification.className}
				</span>
				<span
					role="group"
					aria-labelledby="{id}-{index}"
					class="readout font-roboto-mono"
				>
					<span class="readout-value">
						{formatNumeric(classification.confidence * PERCENT, CONFIDENCE_DECIMALS)}
					</span>
					<span class="readout-suffix">%</span>
				</span>
			</li>
		{/each}
	</ul>
{/if}
