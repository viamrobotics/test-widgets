<!--
@component
A visualizer plugin: mount it inside `<Visualizer>`. It parses PCD bytes and draws them as one
cloud, at the given point size and standing on the given up axis. It frames the first cloud drawn.

The visualizer's own `<PCD>` drops a failed parse, so this parses the bytes itself to report one.

The visualizer's world is z-up, and it has no setting for that. So the up axis turns the cloud,
not the camera: the picked axis is rotated onto the world's z.
-->
<script lang="ts">
	import { useThrelte } from '@threlte/core/webgpu'
	import { traits, useCamera, useWorld } from '@viamrobotics/visualization'
	import { parsePcdInWorker } from '@viamrobotics/visualization/lib'
	import { untrack } from 'svelte'
	import { BufferGeometry, Matrix4, Quaternion, Vector3, type Vector3Tuple } from 'three'

	interface Props {
		/** The bytes of a PCD file. */
		data: Uint8Array
		name: string
		/** Point size in meters. */
		pointSize: number
		/** The cloud's own axis to stand upright, as a unit vector. */
		up: Vector3Tuple
		/** Called with the bytes each time they are written to the cloud. */
		ondrawn: (bytes: Uint8Array) => void
		/** Called when the bytes do not parse. The last cloud stays drawn. */
		onerror: (error: Error) => void
	}

	const { data, name, pointSize, up, ondrawn, onerror }: Props = $props()

	const MM_PER_METER = 1000
	const WORLD_UP = new Vector3(0, 0, 1)

	const world = useWorld()
	const camera = useCamera()
	const { scene } = useThrelte()

	type Cloud = ReturnType<typeof world.spawn>

	// One entity for the widget's life. Each new set of bytes is written into it.
	let cloud = $state.raw<Cloud>()

	const spawnCloud = () =>
		world.spawn(traits.Name(name), traits.Points, traits.BufferGeometry(new BufferGeometry()))

	$effect(() => {
		let isStale = false

		parsePcdInWorker(data).then(
			(parsed) => {
				if (isStale) return
				const entity = untrack(() => cloud) ?? spawnCloud()
				traits.applyParsedPointCloud(entity, parsed, parsed.colors)
				cloud = entity
				ondrawn(data)
			},
			(error: unknown) => {
				if (isStale) return
				onerror(new Error('The point cloud could not be read', { cause: error }))
			}
		)

		return () => {
			isStale = true
		}
	})

	$effect(() => {
		const entity = cloud
		return () => {
			if (entity && world.has(entity)) entity.destroy()
		}
	})

	const uprightMatrix = $derived(
		new Matrix4().makeRotationFromQuaternion(
			new Quaternion().setFromUnitVectors(new Vector3(...up), WORLD_UP)
		)
	)

	$effect(() => {
		if (!cloud) return

		if (cloud.has(traits.Matrix)) cloud.set(traits.Matrix, uprightMatrix)
		else cloud.add(traits.Matrix(uprightMatrix))

		// The trait is in millimeters.
		const pointSizeMm = pointSize * MM_PER_METER
		if (cloud.has(traits.PointSize)) cloud.set(traits.PointSize, pointSizeMm)
		else cloud.add(traits.PointSize(pointSizeMm))
	})

	$effect(() => {
		const entity = cloud
		if (!entity) return

		// `fit` measures the drawn object, which mounts some frames after the entity spawns.
		const fitWhenDrawn = () => {
			if (scene.getObjectByProperty('name', entity) === undefined) {
				frame = requestAnimationFrame(fitWhenDrawn)
				return
			}
			void camera.fit()
		}
		let frame = requestAnimationFrame(fitWhenDrawn)
		return () => cancelAnimationFrame(frame)
	})
</script>
