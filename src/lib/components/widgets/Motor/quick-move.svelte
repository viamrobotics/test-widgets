<script lang="ts">
	import { Slider } from '@viamrobotics/prime-controls'

	import HoldDirectionButtons from './hold-direction-buttons.svelte'
	import { resolvePowerRange } from './resolve-power-range'

	interface Props {
		setPower: (power: number) => void
		onRelease: () => void
		/** True while another motion call is in flight, which disables the button not held. @default false */
		isBusy?: boolean
		/**
		 * The lowest power fraction the slider reaches, from the gpio motor config's `min_power_pct`,
		 * a fraction from 0 to 1. Used only when 0 <= min < max <= 1. @default 0
		 */
		minPowerPct?: number
		/**
		 * The highest power fraction the slider reaches, from the gpio motor config's `max_power_pct`,
		 * a fraction from 0 to 1. Used only when 0 <= min < max <= 1. @default 1
		 */
		maxPowerPct?: number
	}

	type Direction = 'forward' | 'backward'

	const DEFAULT_POWER_FRACTION = 0.5
	const POWER_STEP = 0.05

	const { setPower, onRelease, isBusy = false, minPowerPct, maxPowerPct }: Props = $props()

	const range = $derived(resolvePowerRange(minPowerPct, maxPowerPct))

	// The starting value is clamped into the range, and the slider keeps it there afterward.
	let chosenFraction = $state(DEFAULT_POWER_FRACTION)
	const powerFraction = $derived(Math.min(range.max, Math.max(range.min, chosenFraction)))

	const start = (direction: Direction) => {
		setPower((direction === 'forward' ? 1 : -1) * powerFraction)
	}
</script>

<div class="flex flex-col gap-1">
	<Slider
		label="Power"
		min={range.min}
		max={range.max}
		step={POWER_STEP}
		bind:value={() => powerFraction, (next) => (chosenFraction = next)}
	/>

	<HoldDirectionButtons
		onPress={start}
		{onRelease}
		isDisabled={isBusy}
	/>
</div>
