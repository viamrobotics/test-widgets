<!--
@component
An editable 2d rotation input, presented to the user in degrees
-->
<script lang="ts">
	import { Label, SliderInput } from '@viamrobotics/prime-core'
	import { MathUtils } from 'three'

	interface Props {
		/** The rotation in radians */
		th: number
		/** Fires when orientation changes with the new value in radians */
		oninput?: (th: number) => void
	}

	const { th, oninput = undefined }: Props = $props()

	let input = $state<HTMLInputElement>()

	const handleInput = () => {
		if (!input) {
			return
		}

		const value = input.valueAsNumber

		if (!Number.isNaN(value)) {
			oninput?.(MathUtils.degToRad(value))
		}
	}
</script>

<div class="w-1/2">
	<Label position="top">
		Rotation (deg)
		<SliderInput
			bind:input
			slot="input"
			value={MathUtils.radToDeg(th)}
			placeholder={0}
			on:blur={handleInput}
			on:input={handleInput}
			on:keydown={(event) => event.key === 'Enter' && handleInput()}
		/>
	</Label>
</div>
