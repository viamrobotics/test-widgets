<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements'

	import { NumericInput } from '@viamrobotics/prime-core'

	import { scrubbedValue } from './scrub-value'

	interface Props extends Omit<HTMLInputAttributes, 'value' | 'step' | 'type'> {
		value: number
		step: number
		state?: 'info' | 'warn'
	}

	let { value = $bindable(), step, state: fieldState, ...rest }: Props = $props()

	let input = $state<HTMLInputElement>()
	let handle = $state<HTMLButtonElement>()
	let isDragging = $state(false)
	let startX = 0
	let startValue = 0
	let dragOffset = $state(0)

	const handlePointerDown = (event: PointerEvent) => {
		event.preventDefault()
		event.stopPropagation()
		handle?.setPointerCapture(event.pointerId)
		startX = event.clientX
		startValue = value
		dragOffset = 0
		isDragging = true
		input?.focus()
	}

	const handlePointerMove = (event: PointerEvent) => {
		if (!isDragging) return
		dragOffset = event.clientX - startX
		value = scrubbedValue(startValue, dragOffset, step, {
			shift: event.shiftKey,
			alt: event.altKey,
		})
	}

	const endDrag = () => {
		isDragging = false
	}
</script>

<div class="relative w-full">
	<NumericInput
		{...rest}
		{step}
		state={fieldState}
		{value}
		cx="pl-3"
		bind:input
		on:change={() => {
			const next = input?.valueAsNumber
			value = next !== undefined && Number.isFinite(next) ? next : 0
		}}
	/>
	<button
		bind:this={handle}
		type="button"
		aria-hidden="true"
		tabindex="-1"
		class="absolute bottom-0.75 left-[0.2rem] h-6 w-1 cursor-ew-resize bg-gray-400 hover:bg-gray-700"
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={endDrag}
		onlostpointercapture={endDrag}
	>
		{#if isDragging}
			<span
				data-testid="scrub-cord"
				class="pointer-events-none absolute top-1/2 left-0 h-px bg-gray-400"
				style:width="{Math.abs(dragOffset)}px"
				style:transform="translateX({Math.min(dragOffset, 0)}px)"
			></span>
			<span
				data-testid="scrub-head"
				class="pointer-events-none absolute top-1/2 left-0 -mt-1 -ml-0.5 h-2 w-2 rounded-full bg-gray-800"
				style:transform="translateX({dragOffset}px)"
			></span>
		{/if}
	</button>
</div>
