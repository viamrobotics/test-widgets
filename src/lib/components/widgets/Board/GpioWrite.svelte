<script lang="ts">
	import { NumberField, ToggleButtons } from '@viamrobotics/prime-controls'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'

	import ConfirmingButton from './ConfirmingButton.svelte'

	interface Props {
		setState: (high: boolean) => Promise<boolean>
		/** Takes the duty cycle as the board does, 0 to 1. */
		setDutyCycle: (dutyCycleFraction: number) => Promise<boolean>
		setFrequency: (frequencyHz: number) => Promise<boolean>
		/** True while a write to this pin is in flight. */
		isBusy?: boolean
		/** Why every Set is held back, such as no pin. */
		blockedReason?: string
	}

	const { setState, setDutyCycle, setFrequency, isBusy = false, blockedReason }: Props = $props()

	const LEVEL_ITEMS = [
		{ value: 'low', label: 'Low' },
		{ value: 'high', label: 'High' },
	]
	const PERCENT = 100

	let level = $state('high')
	let dutyCyclePercent = $state<number | undefined>(0)
	let frequencyHz = $state<number | undefined>(0)
</script>

<div class="flex flex-col gap-1">
	<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
		<ToggleButtons
			class="flex-1"
			label="State"
			items={LEVEL_ITEMS}
			bind:value={level}
		/>
		<ConfirmingButton
			verb="Set"
			{isBusy}
			{blockedReason}
			onclick={() => setState(level === 'high')}
		/>
	</div>
	<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
		<NumberField
			class="min-w-37.5 flex-1"
			label="Duty cycle"
			suffix="%"
			min={0}
			max={PERCENT}
			step={1}
			{...emptyOnClear(() => (dutyCyclePercent = undefined))}
			bind:value={dutyCyclePercent}
		/>
		<!-- The field shows 0 to 100 and the board takes 0 to 1. -->
		<ConfirmingButton
			verb="Set"
			{isBusy}
			{blockedReason}
			onclick={() => setDutyCycle((dutyCyclePercent ?? 0) / PERCENT)}
		/>
	</div>
	<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
		<NumberField
			class="min-w-37.5 flex-1"
			label="Frequency"
			suffix="Hz"
			min={0}
			step={1}
			{...emptyOnClear(() => (frequencyHz = undefined))}
			bind:value={frequencyHz}
		/>
		<ConfirmingButton
			verb="Set"
			{isBusy}
			{blockedReason}
			onclick={() => setFrequency(frequencyHz ?? 0)}
		/>
	</div>
</div>
