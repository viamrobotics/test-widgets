<script lang="ts">
	import { formatNumeric } from '$lib/format'

	import PinReadoutRow from './pin-readout-row.svelte'

	interface Props {
		value: number | undefined
		getValue: () => Promise<boolean>
	}

	const { value, getValue }: Props = $props()

	const MISSING_VALUE = '-'

	const valueText = $derived(value === undefined ? MISSING_VALUE : formatNumeric(value, 0))
</script>

<PinReadoutRow
	label="Value"
	onGet={getValue}
>
	{valueText}
</PinReadoutRow>
