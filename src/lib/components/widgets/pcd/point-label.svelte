<script lang="ts">
	import { useThrelte } from '@threlte/core'
	import { HTML } from '@threlte/extras'
	import { onMount } from 'svelte'
	import { type Intersection, type Points, Raycaster, Vector2, Vector3 } from 'three'

	interface Props {
		points: Points
	}

	const { points }: Props = $props()

	const { renderer, size, camera, invalidate } = useThrelte()
	const raycaster = new Raycaster()
	raycaster.firstHitOnly = true
	raycaster.params.Points.threshold = 0.01

	const origin = new Vector3()
	const pointer = new Vector2()

	let intersection = $state<Intersection>()

	const raycast = (event: PointerEvent | WheelEvent) => {
		const { width, height } = $size

		// Standard screen space to NDC space conversion
		pointer.set((event.offsetX / width) * 2 - 1, -(event.offsetY / height) * 2 + 1)

		raycaster.setFromCamera(pointer, camera.current)
		intersection = raycaster.intersectObject(points)[0]
		invalidate()
	}

	const onPointerLeave = () => {
		intersection = undefined
	}

	onMount(() => {
		const canvas = renderer.domElement
		canvas.addEventListener('pointermove', raycast, { passive: true })
		canvas.addEventListener('wheel', raycast, { passive: true })
		canvas.addEventListener('pointerleave', onPointerLeave, { passive: true })
		return () => {
			canvas.removeEventListener('pointermove', raycast)
			canvas.removeEventListener('wheel', raycast)
			canvas.removeEventListener('pointerleave', onPointerLeave)
		}
	})
</script>

{#if intersection}
	{@const { x, y, z } = intersection.point}

	<HTML
		center
		position.x={x}
		position.y={y}
		position.z={z}
	>
		<div class="pointer-events-none -mt-16 bg-black p-2 text-xs whitespace-nowrap text-white">
			x: {x.toFixed(3)}m, y: {y.toFixed(3)}m, z: {z.toFixed(3)}m
			<br />
			distance to origin: {intersection.point.distanceTo(origin).toFixed(3)}m
		</div>

		<!-- Triangle -->
		<div
			class="pointer-events-none absolute left-1/2 -mt-px -ml-1.5 h-0 w-0 border-t-[6px] border-r-[6px] border-l-[6px] border-transparent border-t-black"
		></div>

		<!-- Dot -->
		<div
			class="pointer-events-none absolute left-1/2 z-10 mt-2 -ml-1 h-2 w-2 rounded-full bg-red-500"
		></div>
	</HTML>
{/if}
