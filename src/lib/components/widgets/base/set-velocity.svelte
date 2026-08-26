<script lang="ts">
	import type { Vector3 } from '@viamrobotics/sdk'

	import { Button } from '@viamrobotics/prime-core'

	import Vec3Builder from './vec3-builder.svelte'

	interface Props {
		setVelocity: (linear: Vector3, angular: Vector3) => void
	}

	const { setVelocity }: Props = $props()

	let linearVelocity = $state<Vector3>({ x: 0, y: 50, z: 0 })
	let angularVelocity = $state<Vector3>({ x: 0, y: 0, z: 15 })
</script>

<div class="flex flex-wrap gap-4">
	<Vec3Builder
		title="Linear velocity"
		titleUnits="(mm/s)"
		yTooltip="Only Y is used for a wheeled base, since Viam’s coordinate system considers +Y to be the forward axis."
		bind:vector={linearVelocity}
	/>
	<Vec3Builder
		title="Angular velocity"
		titleUnits="(º/s)"
		zTooltip="Only Z is used for a wheeled base, since Viam’s coordinate system considers +Z to point up and the angular velocity to rotate around the Z axis."
		bind:vector={angularVelocity}
	/>
</div>

<Button
	class="mt-auto"
	icon="play-circle-outline"
	onclick={() => {
		setVelocity(linearVelocity, angularVelocity)
	}}
>
	Execute
</Button>
