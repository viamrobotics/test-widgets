<script lang="ts">
	import { EncoderPositionType } from '@viamrobotics/sdk'
	import { formatNumeric } from '#lib/format.js'

	interface Props {
		data: readonly [number, EncoderPositionType] | undefined
		/** The readout's label, "Position" unless two readouts share a pane. */
		label?: string
	}

	const { data, label = 'Position' }: Props = $props()

	const MISSING_VALUE = '-'
	const DEGREES_SUFFIX = '°'
	const TICKS_SUFFIX = 'ticks'
	const DEGREES_DECIMALS = 1
	const TICKS_DECIMALS = 2

	const decimalsFor = (type: EncoderPositionType) =>
		type === EncoderPositionType.ANGLE_DEGREES ? DEGREES_DECIMALS : TICKS_DECIMALS

	const suffixFor = (type: EncoderPositionType) => {
		if (type === EncoderPositionType.ANGLE_DEGREES) return DEGREES_SUFFIX
		if (type === EncoderPositionType.TICKS_COUNT) return TICKS_SUFFIX
		return undefined
	}

	const valueText = $derived(
		data === undefined ? MISSING_VALUE : formatNumeric(data[0], decimalsFor(data[1]))
	)
	const suffix = $derived(data === undefined ? undefined : suffixFor(data[1]))

	const labelId = $props.id()
</script>

<div class="flex min-w-0 items-center gap-2">
	<span
		id={labelId}
		class="text-subtle-1 w-14 shrink-0 text-xs"
	>
		{label}
	</span>
	<span
		role="group"
		aria-labelledby={labelId}
		class="readout font-roboto-mono"
	>
		<span class="readout-value">{valueText}</span>
		{#if suffix !== undefined}
			<span class="readout-suffix">{suffix}</span>
		{/if}
	</span>
</div>
