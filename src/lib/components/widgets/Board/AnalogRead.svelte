<script lang="ts">
	import { formatNumeric } from '#lib/format.js'

	import PinReadoutRow from './PinReadoutRow.svelte'

	interface Props {
		value: number | undefined
		getValue: () => Promise<boolean>
		/** Why Get is held back, such as no pin. */
		blockedReason?: string
	}

	const { value, getValue, blockedReason }: Props = $props()

	const MISSING_VALUE = '-'

	const valueText = $derived(value === undefined ? MISSING_VALUE : formatNumeric(value, 0))
</script>

<PinReadoutRow
	label="Value"
	onGet={getValue}
	{blockedReason}
>
	{valueText}
</PinReadoutRow>
