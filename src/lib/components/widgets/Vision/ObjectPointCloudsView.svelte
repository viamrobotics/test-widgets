<!--
@component
A visualizer plugin: mount it inside `<Visualizer>`. It draws every object's point cloud with its
geometries over it, each where the service reported it. With `focusedIndex` set, it hides the other
objects and the backdrop, and frames that one.

`backdrop` is the whole cloud the objects were cut from, drawn dimmed behind them. A vision service
reports its objects in the frame of the camera it read, which is the frame that camera's own point
cloud is in, so the two line up with no pose between them.

Objects are drawn in the frame their geometries name, with no frame system behind it, so objects
reported in different frames still share one origin.
-->
<script lang="ts">
	import type { Geometry, PointCloudObject } from '@viamrobotics/sdk'

	import { useThrelte } from '@threlte/core/webgpu'
	import { themeColor } from '@viamrobotics/tailwind-config/theme-color'
	import { traits, useCamera, useWorld } from '@viamrobotics/visualization'
	import { OrientationVector, parsePcdInWorker } from '@viamrobotics/visualization/lib'
	import { untrack } from 'svelte'
	import {
		BufferGeometry,
		Color,
		MathUtils,
		Matrix4,
		Quaternion,
		Vector3,
		type Vector3Tuple,
	} from 'three'

	interface Props {
		objects: PointCloudObject[]
		/** The object to show alone, by its place in `objects`. `undefined` shows them all. */
		focusedIndex: number | undefined
		/** The bytes of a PCD file in the objects' frame, such as the camera's point cloud. */
		backdrop?: Uint8Array
		/** Point size in meters. */
		pointSize: number
		/** The clouds' own axis to stand upright, as a unit vector. */
		up: Vector3Tuple
		/** Called once a set of objects is drawn. */
		ondrawn: () => void
		/** Called when a cloud does not parse. The last objects stay drawn. */
		onerror: (error: Error) => void
	}

	const { objects, focusedIndex, backdrop, pointSize, up, ondrawn, onerror }: Props = $props()

	const MM_PER_METER = 1000
	const WORLD_UP = new Vector3(0, 0, 1)
	const GEOMETRY_OPACITY = 0.25
	const BACKDROP_OPACITY = 0.3
	const geometryColor = new Color(themeColor('--color-success-dark'))

	const world = useWorld()
	const camera = useCamera()
	const { scene } = useThrelte()

	type Entity = ReturnType<typeof world.spawn>
	type ParsedCloud = Awaited<ReturnType<typeof parsePcdInWorker>>

	interface DrawnGeometry {
		entity: Entity
		/** The geometry's pose in the objects' frame, before the up axis turns it. */
		pose: Matrix4
	}

	interface DrawnObject {
		/** `undefined` for an object the service sent no points for. */
		cloud: Entity | undefined
		geometries: DrawnGeometry[]
	}

	let drawn = $state.raw<DrawnObject[]>([])

	const objectName = (index: number) => `Object ${String(index + 1)}`

	// A pose the service left unset has a zero orientation vector, which names no direction.
	const poseMatrix = (center: Geometry['center']): Matrix4 => {
		const matrix = new Matrix4()
		if (!center) return matrix
		const hasDirection = center.oX !== 0 || center.oY !== 0 || center.oZ !== 0
		const orientation = hasDirection
			? new OrientationVector(center.oX, center.oY, center.oZ, MathUtils.degToRad(center.theta))
			: new OrientationVector(0, 0, 1, MathUtils.degToRad(center.theta))
		matrix.makeRotationFromQuaternion(orientation.toQuaternion(new Quaternion()))
		matrix.setPosition(center.x / MM_PER_METER, center.y / MM_PER_METER, center.z / MM_PER_METER)
		return matrix
	}

	const spawnCloud = (index: number, parsed: ParsedCloud): Entity => {
		const entity = world.spawn(
			traits.Name(`${objectName(index)} point cloud`),
			traits.Points,
			traits.BufferGeometry(new BufferGeometry())
		)
		traits.applyParsedPointCloud(entity, parsed, parsed.colors)
		return entity
	}

	const spawnGeometry = (index: number, geometry: Geometry, place: number): DrawnGeometry => {
		const pose = poseMatrix(geometry.center)
		const label = geometry.label || `geometry ${String(place + 1)}`
		const entity = world.spawn(
			traits.Name(`${objectName(index)} ${label}`),
			traits.Matrix(pose.clone()),
			traits.Geometry(geometry),
			traits.Color({ r: geometryColor.r, g: geometryColor.g, b: geometryColor.b }),
			traits.Opacity(GEOMETRY_OPACITY)
		)
		return { entity, pose }
	}

	const entitiesOf = (object: DrawnObject): Entity[] => [
		...(object.cloud ? [object.cloud] : []),
		...object.geometries.map(({ entity }) => entity),
	]

	const destroy = (drawnObjects: DrawnObject[]) => {
		for (const entity of drawnObjects.flatMap((object) => entitiesOf(object))) {
			if (world.has(entity)) entity.destroy()
		}
	}

	$effect(() => {
		const next = objects
		let isStale = false

		// An object with no points has nothing to parse, and still draws its geometries.
		const parses = next.map(({ pointCloud }) =>
			pointCloud.length > 0 ? parsePcdInWorker(pointCloud) : undefined
		)

		Promise.all(parses).then(
			(clouds) => {
				if (isStale) return
				// The last set leaves in the same task the next one arrives, so the scene never draws empty.
				destroy(drawn)
				drawn = next.map((object, index) => {
					const parsed = clouds[index]
					return {
						cloud: parsed ? spawnCloud(index, parsed) : undefined,
						geometries: (object.geometries?.geometries ?? []).map((geometry, place) =>
							spawnGeometry(index, geometry, place)
						),
					}
				})
				ondrawn()
			},
			(error: unknown) => {
				if (isStale) return
				onerror(new Error('An object point cloud could not be read', { cause: error }))
			}
		)

		return () => {
			isStale = true
		}
	})

	$effect(() => () => {
		destroy(drawn)
	})

	// One entity while there is a backdrop. Each new set of bytes is written into it.
	let backdropCloud = $state.raw<Entity>()

	$effect(() => {
		const bytes = backdrop
		if (bytes === undefined) {
			backdropCloud = undefined
			return
		}
		let isStale = false

		parsePcdInWorker(bytes).then(
			(parsed) => {
				if (isStale) return
				const entity =
					untrack(() => backdropCloud) ??
					world.spawn(
						traits.Name('Camera point cloud'),
						traits.Points,
						traits.BufferGeometry(new BufferGeometry()),
						traits.Opacity(BACKDROP_OPACITY)
					)
				traits.applyParsedPointCloud(entity, parsed, parsed.colors)
				backdropCloud = entity
			},
			(error: unknown) => {
				if (isStale) return
				onerror(new Error('The camera point cloud could not be read', { cause: error }))
			}
		)

		return () => {
			isStale = true
		}
	})

	$effect(() => {
		const entity = backdropCloud
		return () => {
			if (entity && world.has(entity)) entity.destroy()
		}
	})

	const uprightMatrix = $derived(
		new Matrix4().makeRotationFromQuaternion(
			new Quaternion().setFromUnitVectors(new Vector3(...up), WORLD_UP)
		)
	)

	const setMatrix = (entity: Entity, matrix: Matrix4) => {
		if (entity.has(traits.Matrix)) entity.set(traits.Matrix, matrix)
		else entity.add(traits.Matrix(matrix))
	}

	const styleCloud = (cloud: Entity) => {
		setMatrix(cloud, uprightMatrix.clone())
		// The trait is in millimeters.
		const pointSizeMm = pointSize * MM_PER_METER
		if (cloud.has(traits.PointSize)) cloud.set(traits.PointSize, pointSizeMm)
		else cloud.add(traits.PointSize(pointSizeMm))
	}

	const setHidden = (entity: Entity, isHidden: boolean) => {
		if (isHidden && !entity.has(traits.Invisible)) entity.add(traits.Invisible)
		if (!isHidden && entity.has(traits.Invisible)) entity.remove(traits.Invisible)
	}

	$effect(() => {
		if (!backdropCloud) return
		styleCloud(backdropCloud)
		setHidden(backdropCloud, focusedIndex !== undefined)
	})

	$effect(() => {
		for (const { cloud, geometries } of drawn) {
			if (cloud) styleCloud(cloud)
			for (const { entity, pose } of geometries) {
				setMatrix(entity, uprightMatrix.clone().multiply(pose))
			}
		}
	})

	$effect(() => {
		for (const [index, object] of drawn.entries()) {
			const isHidden = focusedIndex !== undefined && focusedIndex !== index
			for (const entity of entitiesOf(object)) setHidden(entity, isHidden)
		}
	})

	const hasDrawn = $derived(drawn.length > 0)

	// Frames the first set drawn and each change of focus. A refetch keeps the camera where the person left it.
	$effect(() => {
		if (!hasDrawn) return
		const focused = focusedIndex
		let frame = 0

		const isMounted = (entity: Entity) => scene.getObjectByProperty('name', entity) !== undefined

		// `fit` measures the drawn objects, which mount some frames after their entities spawn.
		const fitWhenDrawn = () => {
			const shown = focused === undefined ? drawn : drawn.slice(focused, focused + 1)
			const entities = shown
				.flatMap((object) => entitiesOf(object))
				.filter((entity) => world.has(entity))
			if (entities.length > 0 && !entities.some((entity) => isMounted(entity))) {
				frame = requestAnimationFrame(fitWhenDrawn)
				return
			}
			void camera.fit(focused === undefined ? undefined : entities)
		}
		frame = requestAnimationFrame(fitWhenDrawn)
		return () => cancelAnimationFrame(frame)
	})
</script>
