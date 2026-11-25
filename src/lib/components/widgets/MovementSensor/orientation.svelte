<script lang="ts">
	import type { Orientation } from '@viamrobotics/sdk'

	import { formatNumeric } from '$lib/format'

	interface Props {
		data: Orientation
	}

	const { data }: Props = $props()

	const MISSING_VALUE = '-'

	const formatOrMissing = (value: number | undefined) =>
		value === undefined ? MISSING_VALUE : formatNumeric(value)

	const id = $props.id()

	const cells = $derived([
		{ tag: 'OX', value: formatOrMissing(data.oX), suffix: '' },
		{ tag: 'OY', value: formatOrMissing(data.oY), suffix: '' },
		{ tag: 'OZ', value: formatOrMissing(data.oZ), suffix: '' },
		{ tag: 'θ', value: formatOrMissing(data.theta), suffix: '°' },
	])
</script>

<div class="grid min-w-0 grid-cols-[1fr_1fr_1fr_1.25fr] gap-2">
	{#each cells as cell (cell.tag)}
		<div class="flex min-w-0 flex-col gap-1">
			<span
				id="{id}-{cell.tag}"
				class="text-subtle-1 text-xs">{cell.tag}</span
			>
			<span
				role="group"
				aria-labelledby="{id}-{cell.tag}"
				class="readout font-roboto-mono"
			>
				<span class="readout-value">{cell.value}</span>
				{#if cell.suffix}
					<span class="readout-suffix">{cell.suffix}</span>
				{/if}
			</span>
		</div>
	{/each}
</div>
