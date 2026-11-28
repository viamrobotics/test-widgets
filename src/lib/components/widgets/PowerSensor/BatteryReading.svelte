<script lang="ts">
	import { formatNumeric } from '#lib/format.js'

	import ReadingRow from './ReadingRow.svelte'

	interface Props {
		data: readonly [number, boolean] | undefined
		/** From `getProperties`. A sensor that cannot tell sends `false` for the charging flag. */
		isChargingSupported: boolean
	}

	const { data, isChargingSupported }: Props = $props()

	const BATTERY_PERCENT_DECIMALS = 1

	const value = $derived(
		data === undefined ? undefined : formatNumeric(data[0], BATTERY_PERCENT_DECIMALS)
	)

	const chargingLabel = $derived.by(() => {
		if (data === undefined || !isChargingSupported) return undefined
		return data[1] ? 'charging' : 'not charging'
	})
</script>

<ReadingRow
	label="Battery"
	{value}
>
	<abbr
		class="readout-suffix no-underline"
		title="percent">%</abbr
	>
	{#if chargingLabel !== undefined}
		<span class="readout-suffix">{chargingLabel}</span>
	{/if}
</ReadingRow>
