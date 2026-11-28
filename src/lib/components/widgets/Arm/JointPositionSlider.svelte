<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Slider } from '@viamrobotics/prime-controls'
	import { type FieldState } from '@viamrobotics/prime-ui'
	import { degreesToRadians, radiansToDegrees } from '#lib/format.js'

	interface Props {
		label: string
		/** The joint's target, in degrees. */
		value: number
		/** Called with the new target in degrees on every change, each drag move included. It must not send a move. */
		onValueChange: (degrees: number) => void
		minDegrees: number
		maxDegrees: number
		useRadians: boolean
		state?: FieldState
		/** Content inside the right edge of the readout, such as a reset button. */
		trailing?: Snippet
	}

	const {
		label,
		value,
		onValueChange,
		minDegrees,
		maxDegrees,
		useRadians,
		state,
		trailing,
	}: Props = $props()

	const ANGLE_UNITS = {
		degrees: { step: 0.1, decimals: 1, suffix: '°' },
		radians: { step: 0.01, decimals: 2, suffix: 'rad' },
	} as const

	// Absorbs binary float residue, so 179.7 × 10 floors to 1797 and not 1796.
	const GRID_TOLERANCE = 1e-9

	const unit = $derived(useRadians ? ANGLE_UNITS.radians : ANGLE_UNITS.degrees)
	const gridFactor = $derived(10 ** unit.decimals)

	const toDisplay = (degrees: number) => (useRadians ? degreesToRadians(degrees) : degrees)
	const toDegrees = (display: number) => (useRadians ? radiansToDegrees(display) : display)
	const roundToStep = (amount: number) => Math.round(amount * gridFactor) / gridFactor

	// The range snaps to min plus a whole number of steps, so a limit off the step grid moves inward onto it.
	const min = $derived(Math.ceil(toDisplay(minDegrees) * gridFactor - GRID_TOLERANCE) / gridFactor)
	const max = $derived(Math.floor(toDisplay(maxDegrees) * gridFactor + GRID_TOLERANCE) / gridFactor)
	const displayValue = $derived(roundToStep(toDisplay(value)))
</script>

<Slider
	{label}
	{min}
	{max}
	step={unit.step}
	suffix={unit.suffix}
	{state}
	{trailing}
	bind:value={
		() => displayValue,
		(next) => {
			onValueChange(toDegrees(roundToStep(next)))
		}
	}
/>
