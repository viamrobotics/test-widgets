import type { MapMouseEvent } from 'maplibre-gl'

import { fromStore } from 'svelte/store'
import { type Camera, Matrix4, type Raycaster, Vector2, Vector3 } from 'three'

import { useMapLibre } from '../hooks.svelte'

/**
 * Provides raycasting against THREE objects projected on to a maplibre map.
 */
export const useMapLibreThreeRaycast = (cameraSignal: { current: Camera }) => {
	const context = useMapLibre()
	const map = fromStore(context.map)

	const pointer = new Vector2()

	const handleMouseMove = (event: MapMouseEvent) => {
		pointer.set(
			(event.point.x / map.current.transform.width) * 2 - 1,
			-(event.point.y / map.current.transform.height) * 2 + 1
		)
	}

	$effect(() => {
		map.current.on('mousemove', handleMouseMove)
		return () => map.current.off('mousemove', handleMouseMove)
	})

	const cameraPosition = new Vector3()
	const mousePosition = new Vector3()
	const viewDirection = new Vector3()
	const camInverseProjection = new Matrix4()

	const compute = (raycaster: Raycaster) => {
		camInverseProjection.copy(cameraSignal.current.projectionMatrix).invert()
		cameraPosition.set(0, 0, 0).applyMatrix4(camInverseProjection)
		mousePosition.set(pointer.x, pointer.y, 1).applyMatrix4(camInverseProjection)
		viewDirection.copy(mousePosition).sub(cameraPosition).normalize()

		raycaster.set(cameraPosition, viewDirection)
	}

	return { compute, pointer }
}
