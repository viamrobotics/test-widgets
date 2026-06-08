<script lang="ts">
	import { Slider, ThemeUtils } from 'svelte-tweakpane-ui'

	import { degreesToRadians, formatNumeric, radiansToDegrees } from '$lib/format'

	interface Props {
		value: number
		minDegrees: number
		maxDegrees: number
		useRadians: boolean
	}

	let { value = $bindable(), minDegrees, maxDegrees, useRadians }: Props = $props()

	const min = $derived(useRadians ? degreesToRadians(minDegrees) : minDegrees)
	const max = $derived(useRadians ? degreesToRadians(maxDegrees) : maxDegrees)
	const step = $derived(useRadians ? 0.01 : 0.1)

	const sliderFormat = (v: number) => formatNumeric(v, useRadians ? 3 : 1)

	let sliderValue = $state(0)

	const toDisplay = (degrees: number) => (useRadians ? degreesToRadians(degrees) : degrees)
	const toDegrees = (display: number) => (useRadians ? radiansToDegrees(display) : display)

	$effect(() => {
		sliderValue = toDisplay(value)
	})

	$effect(() => {
		const degrees = toDegrees(sliderValue)
		if (Math.abs(degrees - value) > 1e-6) {
			value = degrees
		}
	})
</script>

<div class="joint-slider min-w-0">
	<Slider
		bind:value={sliderValue}
		{min}
		{max}
		{step}
		format={sliderFormat}
		theme={ThemeUtils.presets.light}
	/>
</div>
