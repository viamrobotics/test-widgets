<script lang="ts">
	import { T, useThrelte } from '@threlte/core'
	import { MathUtils, OrthographicCamera, type Vector2, Vector3 } from 'three'
	import { MapControls } from 'three/examples/jsm/controls/MapControls.js'

	import BaseMarker from './base-marker.txt?raw'
	import DestMarker from './destination-marker.txt?raw'
	import Helpers from './helpers.svelte'
	import { useRaycastClick } from './hooks/use-raycast-click'
	import Marker from './marker.svelte'
	import MotionPath from './motion-path.svelte'
	import Points from './points.svelte'

	interface Props {
		helpers: boolean
		pointcloud: Uint8Array | undefined
		basePose?: { x: number; y: number; theta: number } | undefined
		destination: Vector2 | undefined
		motionPath?: Float32Array | undefined
		onClick: (value: Vector3) => void
	}

	const {
		helpers,
		pointcloud,
		basePose = undefined,
		destination,
		motionPath = undefined,
		onClick,
	}: Props = $props()

	useRaycastClick((vec3) => onClick(vec3))

	const { renderer, invalidate, dom } = useThrelte()

	const baseSpriteSize = 15.5
	const defaultPointSize = 0.03

	const camera = new OrthographicCamera()
	camera.zoom = 10

	const controls = new MapControls(camera, dom)

	let userControlling = $state(false)
	let zoom = $state(camera.zoom)

	const handleControlsChange = () => {
		invalidate()
		zoom = camera.zoom
	}

	interface UpdateEvent {
		radius: number
		center: { x: number; y: number }
	}

	const handlePointsUpdate = ({ center, radius }: UpdateEvent) => {
		if (!userControlling) {
			camera.position.set(center.x, center.y, 1)
			camera.lookAt(center.x, center.y, 0)
			controls.target.set(center.x, center.y, 0)

			const viewHeight = 1
			const viewWidth = viewHeight * 2
			const aspect = renderer.domElement.clientHeight / renderer.domElement.clientWidth
			const aspectInverse = 0.008

			camera.zoom =
				aspect > 1 ? viewHeight / (radius * aspectInverse) : viewWidth / (radius * aspectInverse)
			camera.updateProjectionMatrix()

			zoom = camera.zoom
		}
	}

	const markerScale = $derived(baseSpriteSize / zoom)
</script>

<T
	is={camera}
	makeDefault
	near={0.1}
	far={2}
	zoom={10}
>
	<T
		is={controls}
		enableRotate={false}
		screenSpacePanning={true}
		onchange={handleControlsChange}
		onstart={() => (userControlling = true)}
	/>
</T>

{#if helpers}
	<Helpers />
{/if}

{#if pointcloud}
	<Points
		{pointcloud}
		size={zoom * defaultPointSize * window.devicePixelRatio}
		onUpdate={handlePointsUpdate}
	/>
{/if}

<Marker
	name="Base marker"
	url={BaseMarker}
	visible={basePose !== undefined}
	position.x={basePose?.x}
	position.y={basePose?.y}
	scale.x={markerScale}
	scale.y={markerScale}
	rotation={MathUtils.degToRad((basePose?.theta ?? 0) - 90)}
/>

<Marker
	name="Destination marker"
	visible={destination !== undefined}
	url={DestMarker}
	position.x={destination?.x}
	position.y={destination?.y}
	scale.x={markerScale}
	scale.y={markerScale}
	center.x={0.5}
	center.y={0.05}
/>

<MotionPath path={motionPath} />
