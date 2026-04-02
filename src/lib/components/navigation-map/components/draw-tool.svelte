<!-- 
  @component
  Renders an in-progress rectangle that represents a drawn area by the user.
-->
<script lang="ts">
	import type * as THREE from 'three'

	import { T } from '@threlte/core'
	import { theme } from '@viamrobotics/prime-core/theme'
	import {
		LngLat,
		type MapLayerMouseEvent,
		type MapLayerTouchEvent,
		type MapMouseEvent,
		MercatorCoordinate,
	} from 'maplibre-gl'
	import { fromStore } from 'svelte/store'

	import {
		cartesianToMercator,
		lngLatToMercator,
		useMapLibre,
		useMapLibreEvent,
	} from '../../maplibre'
	import { useNavigationMap } from '../use-navigation-map.svelte'

	interface Props {
		/** Fires when a rectangle is drawn. */
		onUpdate: (payload: { width: number; height: number; center: LngLat }) => void
	}

	const { onUpdate }: Props = $props()

	const context = useMapLibre()
	const map = fromStore(context.map)
	const nav = useNavigationMap()

	let downLngLat = $state(new LngLat(0, 0))
	let downMercator = new MercatorCoordinate(0, 0, 0)

	let drawing = $state(false)
	let width = $state(0)
	let height = $state(0)

	const moveSign = $state({ x: 0, y: 0 })

	const toPrecisionLevel = (number: number, decimals: number): number => {
		const multiplier = 10 ** decimals
		return Math.floor(number * multiplier) / multiplier
	}

	const handlePointerDown = (event: MapLayerMouseEvent | MapLayerTouchEvent) => {
		event.preventDefault()
		drawing = true
		downLngLat = event.lngLat
		downMercator = lngLatToMercator(downLngLat)
	}

	const handlePointerMove = (event: MapMouseEvent) => {
		const moveMercator = lngLatToMercator(event.lngLat)
		const scale = moveMercator.meterInMercatorCoordinateUnits()

		moveSign.x = Math.sign(moveMercator.x - downMercator.x)
		moveSign.y = Math.sign(moveMercator.y - downMercator.y)

		width = toPrecisionLevel(Math.abs(moveMercator.x - downMercator.x) / scale, 2)
		height = toPrecisionLevel(Math.abs(moveMercator.y - downMercator.y) / scale, 2)
	}

	const handlePointerUp = () => {
		drawing = false

		const scale = downMercator.meterInMercatorCoordinateUnits()
		const offset = cartesianToMercator(-moveSign.x * (width / 2), -moveSign.y * (height / 2), scale)

		downMercator.x -= offset.x
		downMercator.y -= offset.y

		const center = downMercator.toLngLat()

		onUpdate({ width, height, center })

		width = 0
		height = 0
	}

	const handleGeometryCreate = (ref: THREE.BufferGeometry) => {
		ref.rotateX(-Math.PI / 2)
	}

	useMapLibreEvent('mousedown', (event) => {
		if (event.originalEvent.shiftKey) {
			handlePointerDown(event)
		}
	})

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.shiftKey) {
			map.current.getCanvas().classList.add('!cursor-crosshair')
		}
	}

	const handleKeyup = () => {
		map.current.getCanvas().classList.remove('!cursor-crosshair')
	}

	$effect(() => {
		if (drawing) {
			map.current.on('mousemove', handlePointerMove)
			map.current.on('mouseup', handlePointerUp)
		} else {
			map.current.off('mousemove', handlePointerMove)
			map.current.off('mouseup', handlePointerUp)
		}

		return () => {
			map.current.off('mousemove', handlePointerMove)
			map.current.off('mouseup', handlePointerUp)
		}
	})
</script>

<svelte:window
	onkeydown={handleKeydown}
	onkeyup={handleKeyup}
/>

<T.Group userData.lngLat={downLngLat}>
	<T.Mesh
		position.x={(-moveSign.x * width) / 2}
		position.z={(-moveSign.y * height) / 2}
	>
		{#if nav.view === '3D'}
			<T.BoxGeometry
				args={[width, height, 10]}
				oncreate={handleGeometryCreate}
			/>
		{:else}
			<T.PlaneGeometry
				args={[width, height]}
				oncreate={handleGeometryCreate}
			/>
		{/if}
		<T.MeshPhongMaterial color={theme.extend.colors.cyberpunk} />
	</T.Mesh>
</T.Group>
