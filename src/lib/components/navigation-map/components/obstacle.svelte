<script lang="ts">
	import { T } from '@threlte/core'
	import { AxesHelper, CapsuleGeometry } from '@viamrobotics/motion-tools/lib'
	import { theme } from '@viamrobotics/prime-core/theme'
	import {
		LngLat,
		type MapLayerMouseEvent,
		type MapLayerTouchEvent,
		type MapMouseEvent,
	} from 'maplibre-gl'
	import { fromStore } from 'svelte/store'
	import { type BufferGeometry, Vector2 } from 'three'

	import type { Obstacle } from '../types'

	import { useMapLibre, useMapLibreEvent } from '../../maplibre'
	import { useNavigationMap } from '../use-navigation-map.svelte'

	interface Props {
		/** The obstacle name. */
		name: string
		/** Fired when obstacles are created, destroyed, or edited. */
		onupdate: (payload: Obstacle) => void
	}

	const { name, onupdate }: Props = $props()

	const context = useMapLibre()
	const map = fromStore(context.map)
	const nav = useNavigationMap()

	let pointerdownTheta = 0
	let pointerdownRadius = 0
	let pointerdownLength = 0
	let pointerdownWidth = 0
	let pointerdownHeight = 0

	let draggingObstacle = $state(false)

	const pointermove = new Vector2()
	const pointerdown = new Vector2()

	const debugMode = $derived(nav.environment === 'debug')
	const obstacle = $derived(nav.obstacles.find((item) => item.name === name))

	const handleGeometryCreate = (ref: BufferGeometry) => {
		ref.rotateX(-Math.PI / 2)
	}

	const handlePointerDown = () => {
		nav.selected = name

		if (debugMode) {
			return
		}

		map.current.dragPan.disable()
		draggingObstacle = true
	}

	const handleMapPointerDown = (event: MapLayerMouseEvent | MapLayerTouchEvent) => {
		if (debugMode) {
			return
		}

		const ev = event.originalEvent
		const isManipulating = ev.metaKey || ev.ctrlKey || ev.altKey

		if (isManipulating) {
			event.preventDefault()
			map.current.getCanvas().classList.add('!cursor-ns-resize')
		}

		pointerdown.set(event.point.x, event.point.y)

		const geometry = obstacle?.geometries[0]
		if (!geometry) {
			return
		}

		pointerdownTheta = geometry.pose.orientationVector.th

		switch (geometry.type) {
			case 'sphere': {
				pointerdownRadius = geometry.radius
				break
			}
			case 'box': {
				pointerdownLength = geometry.length
				pointerdownWidth = geometry.width
				pointerdownHeight = geometry.height
				break
			}
			case 'capsule': {
				pointerdownRadius = geometry.radius
				pointerdownLength = geometry.length
				break
			}
		}
	}

	const handlePointerMove = (event: MapMouseEvent) => {
		if (nav.selected === null) {
			return
		}

		if (!obstacle) {
			return
		}

		const geometry = obstacle.geometries[0]
		if (!geometry) {
			return
		}

		// Rotate
		if (event.originalEvent.metaKey || event.originalEvent.ctrlKey) {
			pointermove.set(event.point.x, event.point.y)
			pointermove.sub(pointerdown)

			geometry.pose.orientationVector.th = pointerdownTheta + pointermove.y / 10

			onupdate({
				...obstacle,
				geometries: [geometry],
			})

			// Scale
		} else if (event.originalEvent.altKey) {
			pointermove.set(event.point.x, event.point.y)
			pointermove.sub(pointerdown)

			const { y } = pointermove

			switch (geometry.type) {
				case 'sphere': {
					geometry.radius = Math.max(0, pointerdownRadius - y)
					break
				}
				case 'box': {
					geometry.length = Math.max(0, pointerdownLength - y)
					geometry.width = Math.max(0, pointerdownWidth - y)
					geometry.height = Math.max(0, pointerdownHeight - y)
					break
				}
				case 'capsule': {
					geometry.radius = Math.max(0, pointerdownRadius - y)
					geometry.length = Math.max(0, pointerdownLength - y)
					break
				}
			}

			onupdate({
				...obstacle,
				geometries: [geometry],
			})

			// Transform
		} else {
			onupdate({
				...obstacle,
				location: new LngLat(event.lngLat.lng, event.lngLat.lat),
			})
		}
	}

	const handlePointerUp = () => {
		draggingObstacle = false
		map.current.dragPan.enable()
		map.current.getCanvas().classList.remove('!cursor-ns-resize')
	}

	const active = $derived(nav.hovered === name || nav.selected === name)

	$effect(() => {
		if (draggingObstacle) {
			map.current.on('mousemove', handlePointerMove)
		} else {
			map.current.off('mousemove', handlePointerMove)
		}

		return () => {
			map.current.off('mousemove', handlePointerMove)
		}
	})

	useMapLibreEvent('mousedown', handleMapPointerDown)
</script>

<svelte:window onpointerup={handlePointerUp} />

{#if obstacle}
	{#each obstacle.geometries as geometry, index (index)}
		<T.Mesh
			{name}
			obstacle={name}
			userData.lngLat={obstacle.location}
			rotation.y={geometry.pose.orientationVector.th}
			onpointerenter={() => (nav.hovered = name)}
			onpointerleave={() => (nav.hovered = undefined)}
			onpointerdown={() => handlePointerDown()}
		>
			{#if geometry.type === 'box'}
				{#if active}
					<AxesHelper
						raycast={() => null}
						length={Math.max(geometry.length, geometry.width, geometry.height) * 2}
						depthTest={false}
					/>
				{/if}

				{#if nav.view === '3D'}
					<T.BoxGeometry
						computeBounding={name}
						args={[geometry.length, geometry.width, geometry.height]}
						oncreate={handleGeometryCreate}
					/>
				{:else}
					<T.PlaneGeometry
						computeBounding={name}
						args={[geometry.length, geometry.width]}
						oncreate={handleGeometryCreate}
					/>
				{/if}
			{:else if geometry.type === 'sphere'}
				<!--
        Points are defined as a sphere with radius 0.
        Those points use sensible defaults defined below.
      -->
				{#if active}
					<AxesHelper
						raycast={() => null}
						length={geometry.radius * 2}
						depthTest={false}
					/>
				{/if}

				{#if nav.view === '3D'}
					<T.SphereGeometry
						computeBounding={name}
						args={[geometry.radius || 5]}
						oncreate={handleGeometryCreate}
					/>
				{:else}
					<T.CircleGeometry
						computeBounding={name}
						args={[geometry.radius || 5]}
						oncreate={handleGeometryCreate}
					/>
				{/if}
			{:else if geometry.type === 'capsule'}
				{#if active}
					<AxesHelper
						raycast={() => null}
						length={Math.max(geometry.radius, geometry.length) * 2}
						depthTest={false}
					/>
				{/if}

				<T
					is={CapsuleGeometry}
					computeBounding={name}
					args={[geometry.radius, geometry.length, 16, 32]}
					oncreate={handleGeometryCreate}
				/>
			{/if}

			<T.MeshPhongMaterial color={active ? theme.extend.colors['solar-power'] : obstacle.color} />
		</T.Mesh>
	{/each}
{/if}
