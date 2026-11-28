<script lang="ts">
	import type { Vector3 } from '@viamrobotics/sdk'

	import { mdiPlayCircleOutline } from '@mdi/js'
	import { Point, type PointValue } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'

	interface Props {
		setPower: (linear: Vector3, angular: Vector3) => void
		/** True while another motion call is in flight, which holds back Execute. @default false */
		isBusy?: boolean
	}

	const { setPower, isBusy = false }: Props = $props()

	let linearPower = $state<PointValue>({ x: 0.5, y: 0, z: 0 })
	let angularPower = $state<PointValue>({ x: 0, y: 0, z: 0.75 })

	const toVector = (point: PointValue): Vector3 => ({
		x: point.x,
		y: point.y,
		z: point.z ?? 0,
	})
</script>

<div class="flex w-full flex-col gap-2">
	<Point
		label="Linear"
		hint={[
			'The percentage of max power of the base’s linear propulsion. In the range of –1.0 to 1.0, with 1.0 meaning 100% power.',
			'',
			'X: +X is right, –X is left',
			'Y: +Y is forward, –Y is backward',
			'Z: +Z is up, –Z is down',
		].join('\n')}
		min={-1}
		max={1}
		step={0.05}
		bind:value={linearPower}
	/>
	<Point
		label="Angular"
		hint={[
			'The percentage of max power of the base’s angular propulsion. In the range of -1.0 to 1.0, with 1.0 meaning 100% power.',
			'',
			'Z: +Z is left, –Z is right',
		].join('\n')}
		min={-1}
		max={1}
		step={0.05}
		bind:value={angularPower}
	/>
	<div class="flex justify-end">
		<button
			type="button"
			class="button button-compact"
			disabled={isBusy}
			onclick={() => {
				setPower(toVector(linearPower), toVector(angularPower))
			}}
		>
			<Icon icon={mdiPlayCircleOutline} />
			Execute
		</button>
	</div>
</div>
