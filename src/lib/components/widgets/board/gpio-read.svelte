<script lang="ts">
	import { StatusDot } from '@viamrobotics/prime-ui'

	import { formatNumeric } from '$lib/format'

	import PinReadoutRow from './pin-readout-row.svelte'

	interface Props {
		gpioState: boolean | undefined
		/** The duty cycle as the board reports it, 0 to 1. */
		pwmDutyCycle: number | undefined
		pwmFrequency: number | undefined
		getState: () => Promise<boolean>
		getDutyCycle: () => Promise<boolean>
		getFrequency: () => Promise<boolean>
	}

	const { gpioState, pwmDutyCycle, pwmFrequency, getState, getDutyCycle, getFrequency }: Props =
		$props()

	const MISSING_VALUE = '-'
	const PERCENT = 100
	const DUTY_CYCLE_DECIMALS = 2

	const dutyCycleText = $derived(
		pwmDutyCycle === undefined
			? MISSING_VALUE
			: formatNumeric(pwmDutyCycle * PERCENT, DUTY_CYCLE_DECIMALS)
	)
	const frequencyText = $derived(
		pwmFrequency === undefined ? MISSING_VALUE : formatNumeric(pwmFrequency, 0)
	)
	const stateText = $derived(gpioState ? 'High' : 'Low')
</script>

<div class="flex flex-col gap-1">
	<PinReadoutRow
		label="State"
		onGet={getState}
	>
		{#if gpioState === undefined}
			{MISSING_VALUE}
		{:else}
			<StatusDot
				state={gpioState ? 'success' : 'disabled'}
				label={stateText}
			/>
			{stateText}
		{/if}
	</PinReadoutRow>
	<PinReadoutRow
		label="Duty cycle"
		unit="%"
		onGet={getDutyCycle}
	>
		{dutyCycleText}
	</PinReadoutRow>
	<PinReadoutRow
		label="Frequency"
		unit="Hz"
		onGet={getFrequency}
	>
		{frequencyText}
	</PinReadoutRow>
</div>
