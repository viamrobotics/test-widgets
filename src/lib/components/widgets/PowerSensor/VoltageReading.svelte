<script lang="ts">
	import { formatNumeric } from '#lib/format.js'

	import ReadingRow from './ReadingRow.svelte'

	interface Props {
		data: readonly [number, boolean] | undefined
	}

	const { data }: Props = $props()

	const POWER_READING_DECIMALS = 4

	const value = $derived(
		data === undefined ? undefined : formatNumeric(data[0], POWER_READING_DECIMALS)
	)

	const acDcLabel = $derived.by(() => {
		if (data === undefined) return undefined
		return data[1] ? 'AC' : 'DC'
	})
</script>

<ReadingRow
	label="Voltage"
	{value}
>
	<span class="readout-suffix">V</span>
	{#if acDcLabel !== undefined}
		<span class="readout-suffix">{acDcLabel}</span>
	{/if}
</ReadingRow>
