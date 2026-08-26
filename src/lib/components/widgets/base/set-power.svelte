<script lang="ts">
	import type { Vector3 } from '@viamrobotics/sdk'

	import { Button } from '@viamrobotics/prime-core'

	import Vec3Builder from './vec3-builder.svelte'

	interface Props {
		setPower: (linear: Vector3, angular: Vector3) => void
	}

	const { setPower }: Props = $props()

	let linearPower = $state<Vector3>({ x: 0.5, y: 0, z: 0 })
	let angularPower = $state<Vector3>({ x: 0, y: 0, z: 0.75 })
</script>

<div class="flex flex-wrap gap-4">
	<Vec3Builder
		title="Linear power"
		titleTooltip="The percentage of max power of the base’s linear propulsion. In the range of –1.0 to 1.0, with 1.0 meaning 100% power."
		xTooltip="+X is right, –X is left"
		yTooltip="+Y is forward, –Y is backward"
		zTooltip="+Z is up, –Z is down"
		bind:vector={linearPower}
	/>
	<Vec3Builder
		title="Angular power"
		titleTooltip="The percentage of max power of the base’s angular propulsion. In the range of -1.0 to 1.0, with 1.0 meaning 100% power."
		zTooltip="+Z is left, –Z is right"
		bind:vector={angularPower}
	/>
</div>

<Button
	class="mt-auto"
	icon="play-circle-outline"
	onclick={() => {
		setPower(linearPower, angularPower)
	}}
>
	Execute
</Button>
