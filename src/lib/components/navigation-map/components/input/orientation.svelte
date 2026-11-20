<!--
@component
An editable 2d rotation input, presented to the user in degrees
-->
<script lang="ts">
	import { NumberField } from '@viamrobotics/prime-controls'
	import { MathUtils } from 'three'

	interface Props {
		/** The rotation in radians */
		th: number
		/** Fires when orientation changes with the new value in radians */
		oninput?: (th: number) => void
	}

	const { th, oninput = undefined }: Props = $props()

	const handleDegreesInput = (degrees: number | undefined) => {
		if (degrees !== undefined && !Number.isNaN(degrees)) {
			oninput?.(MathUtils.degToRad(degrees))
		}
	}
</script>

<div class="w-1/2">
	<NumberField
		label="Rotation (deg)"
		placeholder="0"
		bind:value={() => MathUtils.radToDeg(th), handleDegreesInput}
	/>
</div>
