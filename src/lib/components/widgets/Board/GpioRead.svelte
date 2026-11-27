<script lang="ts">
	import { StatusDot } from '@viamrobotics/prime-ui'
	import { formatNumeric } from '#lib/format.js'

	import PinReadoutRow from './PinReadoutRow.svelte'

	interface Props {
		gpioState: boolean | undefined
		/** The duty cycle as the board reports it, 0 to 1. */
		pwmDutyCycle: number | undefined
		pwmFrequency: number | undefined
		getState: () => Promise<boolean>
		getDutyCycle: () => Promise<boolean>
		getFrequency: () => Promise<boolean>
		/** Why Get on Duty cycle and Frequency is held back, such as no pin. */
		blockedReason?: string
		/** Why Get on State is held back. It also waits on a write to the pin. */
		stateBlockedReason?: string
	}

	const {
		gpioState,
		pwmDutyCycle,
		pwmFrequency,
		getState,
		getDutyCycle,
		getFrequency,
		blockedReason,
		stateBlockedReason,
	}: Props = $props()

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
		blockedReason={stateBlockedReason}
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
		{blockedReason}
	>
		{dutyCycleText}
	</PinReadoutRow>
	<PinReadoutRow
		label="Frequency"
		unit="Hz"
		onGet={getFrequency}
		{blockedReason}
	>
		{frequencyText}
	</PinReadoutRow>
</div>
