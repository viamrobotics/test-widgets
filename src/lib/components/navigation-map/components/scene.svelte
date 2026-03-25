<script lang="ts">
	import type { LngLat } from 'maplibre-gl'

	import { T, useThrelte } from '@threlte/core'
	import { theme } from '@viamrobotics/prime-core/theme'
	import { Camera, Plane, Vector3 } from 'three'

	import type { Obstacle } from '../types'

	import { useMapLibreThreeRenderer } from '../../maplibre'
	import { createName } from '../lib/create-name'
	import { createObstacle } from '../lib/create-obstacle'
	import { computeBoundingPlugin } from '../plugins/compute-bounding.svelte'
	import { interactivityPlugin } from '../plugins/interactivity'
	import { useNavigationMap } from '../use-navigation-map.svelte'
	import Drawtool from './draw-tool.svelte'
	import ObstacleGeometries from './obstacle.svelte'
	import Path from './path.svelte'

	interface Props {
		onUpdate: (payload: Obstacle[]) => void
	}

	const { onUpdate }: Props = $props()

	const nav = useNavigationMap()

	computeBoundingPlugin()
	interactivityPlugin()

	const { renderer, scene, camera } = useThrelte()
	const clippingPlane = new Plane(new Vector3(0, 1, 0), 0)

	camera.set(new Camera())

	useMapLibreThreeRenderer(scene, camera, () => {
		renderer.render(scene, camera.current)
	})

	const handleUpdate = () => {
		onUpdate(nav.obstacles)
	}

	const handleDraw = ({
		width,
		height,
		center,
	}: {
		width: number
		height: number
		center: LngLat
	}) => {
		const names = nav.obstacles.map((obstacle) => obstacle.name)
		const name = createName(names, 'obstacle', nav.obstacles.length)
		const obstacle = createObstacle(name, center)

		if (obstacle.geometries[0]?.type === 'box') {
			obstacle.geometries[0].length = width
			obstacle.geometries[0].width = height
		}

		nav.obstacles = [obstacle, ...nav.obstacles]
		nav.selected = obstacle.name

		onUpdate(nav.obstacles)
	}

	const flat = $derived(nav.view === '2D')

	// This clips against the map so that objects intersecting sea level will not render over the map
	$effect.pre(() => {
		renderer.clippingPlanes = flat ? [] : [clippingPlane]
	})
</script>

<T.AmbientLight intensity={flat ? 2 : 1.5} />

{#if !flat}
	<T.DirectionalLight intensity={1.5} />
{/if}

{#each nav.obstacles as obstacle (obstacle.name)}
	<ObstacleGeometries
		name={obstacle.name}
		onupdate={handleUpdate}
	/>
{/each}

{#each nav.paths as path, i (i)}
	<Path
		{path}
		color={theme.extend.colors.hyperlink}
	/>
{/each}

{#if nav.environment === 'configure'}
	<Drawtool onUpdate={handleDraw} />
{/if}
