<script lang="ts">
	import { formatNumeric } from '#lib/format.js'

	import ReadingRow from './ReadingRow.svelte'

	interface Props {
		data: number | undefined
	}

	const { data }: Props = $props()

	const POWER_READING_DECIMALS = 4

	const value = $derived(
		data === undefined ? undefined : formatNumeric(data, POWER_READING_DECIMALS)
	)
</script>

<ReadingRow
	label="Power"
	{value}
>
	<span class="readout-suffix">W</span>
</ReadingRow>
