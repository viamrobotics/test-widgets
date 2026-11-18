<script lang="ts">
	import type { Vector3 } from '@viamrobotics/sdk'

	import { formatNumeric } from '$lib/format'

	interface Props {
		data: Vector3
		unit?: string
	}

	const { data, unit = '' }: Props = $props()

	const MISSING_VALUE = '-'

	const formatOrMissing = (value: number | undefined) =>
		value === undefined ? MISSING_VALUE : formatNumeric(value)

	const id = $props.id()

	const cells = $derived([
		{ tag: 'X', value: formatOrMissing(data.x) },
		{ tag: 'Y', value: formatOrMissing(data.y) },
		{ tag: 'Z', value: formatOrMissing(data.z) },
	])
</script>

<div class="grid min-w-0 grid-cols-3 gap-2">
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
				{#if unit}
					<span class="readout-suffix">{unit}</span>
				{/if}
			</span>
		</div>
	{/each}
</div>
