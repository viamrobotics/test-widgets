<script lang="ts">
	import type { Vector3 } from '@viamrobotics/sdk'

	import { mdiPlayCircleOutline } from '@mdi/js'
	import { Point, type PointValue } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'

	interface Props {
		setVelocity: (linear: Vector3, angular: Vector3) => void
	}

	const { setVelocity }: Props = $props()

	let linearVelocity = $state<PointValue>({ x: 0, y: 50, z: 0 })
	let angularVelocity = $state<PointValue>({ x: 0, y: 0, z: 15 })

	const toVector = (point: PointValue): Vector3 => ({
		x: point.x,
		y: point.y,
		z: point.z ?? 0,
	})
</script>

<div class="flex w-full flex-col gap-2">
	<!-- The unit is in the group label, because a per-axis suffix clips -1000 at 270 px. -->
	<Point
		label="Linear, mm/s"
		hint="Y: Only Y is used for a wheeled base, since Viam’s coordinate system considers +Y to be the forward axis."
		bind:value={linearVelocity}
	/>
	<Point
		label="Angular, °/s"
		hint="Z: Only Z is used for a wheeled base, since Viam’s coordinate system considers +Z to point up and the angular velocity to rotate around the Z axis."
		bind:value={angularVelocity}
	/>
	<div class="flex justify-end">
		<button
			type="button"
			class="button button-compact"
			onclick={() => {
				setVelocity(toVector(linearVelocity), toVector(angularVelocity))
			}}
		>
			<Icon icon={mdiPlayCircleOutline} />
			Execute
		</button>
	</div>
</div>
