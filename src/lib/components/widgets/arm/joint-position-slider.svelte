<script lang="ts">
	import { Slider, ThemeUtils } from 'svelte-tweakpane-ui'

	import { degreesToRadians, formatNumeric, radiansToDegrees } from '$lib/format'

	interface Props {
		value: number
		onValueChange: (degrees: number) => void
		minDegrees: number
		maxDegrees: number
		useRadians: boolean
	}

	const { value, onValueChange, minDegrees, maxDegrees, useRadians }: Props = $props()

	const min = $derived(useRadians ? degreesToRadians(minDegrees) : minDegrees)
	const max = $derived(useRadians ? degreesToRadians(maxDegrees) : maxDegrees)
	const step = $derived(useRadians ? 0.01 : 0.1)

	const sliderFormat = (v: number) => formatNumeric(v, useRadians ? 3 : 1)
	const toDisplay = (degrees: number) => (useRadians ? degreesToRadians(degrees) : degrees)
	const toDegrees = (display: number) => (useRadians ? radiansToDegrees(display) : display)
</script>

<div class="joint-slider min-w-0">
	<Slider
		value={toDisplay(value)}
		on:change={(event) => {
			// The slider also reports changes to `value` from outside, such as a live reading arriving.
			if (event.detail.origin === 'internal') {
				onValueChange(toDegrees(event.detail.value))
			}
		}}
		{min}
		{max}
		{step}
		format={sliderFormat}
		theme={ThemeUtils.presets.light}
	/>
</div>
