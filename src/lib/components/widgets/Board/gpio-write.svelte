<script lang="ts">
	import { NumberField, ToggleButtons } from '@viamrobotics/prime-controls'

	import ConfirmingButton from './confirming-button.svelte'

	interface Props {
		setState: (high: boolean) => Promise<boolean>
		/** Takes the duty cycle as the board does, 0 to 1. */
		setDutyCycle: (dutyCycleFraction: number) => Promise<boolean>
		setFrequency: (frequencyHz: number) => Promise<boolean>
		/** True while a write to this pin is in flight. */
		isBusy?: boolean
	}

	const { setState, setDutyCycle, setFrequency, isBusy = false }: Props = $props()

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
			bind:value={dutyCyclePercent}
		/>
		<!-- The field shows 0 to 100 and the board takes 0 to 1. -->
		<ConfirmingButton
			verb="Set"
			{isBusy}
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
			bind:value={frequencyHz}
		/>
		<ConfirmingButton
			verb="Set"
			{isBusy}
			onclick={() => setFrequency(frequencyHz ?? 0)}
		/>
	</div>
</div>
