<script lang="ts">
	import { formatNumeric } from '$lib/format'

	interface Props {
		data: readonly [number, boolean] | undefined
	}

	const { data }: Props = $props()

	const MISSING_VALUE = '-'
	const POWER_READING_DECIMALS = 4

	const valueText = $derived(
		data === undefined ? MISSING_VALUE : formatNumeric(data[0], POWER_READING_DECIMALS)
	)

	const labelId = $props.id()

	const acDcLabel = $derived.by(() => {
		if (data === undefined) return undefined
		return data[1] ? 'AC' : 'DC'
	})
</script>

<div class="flex min-w-0 items-center gap-2">
	<span
		id={labelId}
		class="text-subtle-1 w-14 shrink-0 text-xs"
	>
		Voltage
	</span>
	<span
		role="group"
		aria-labelledby={labelId}
		class="readout font-roboto-mono"
	>
		<span class="readout-value">{valueText}</span>
		<span class="readout-suffix">V</span>
		{#if acDcLabel !== undefined}
			<span class="readout-suffix">{acDcLabel}</span>
		{/if}
	</span>
</div>
