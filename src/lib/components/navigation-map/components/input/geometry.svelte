<script lang="ts">
	import { NumberField, Point, type PointValue, ToggleButtons } from '@viamrobotics/prime-controls'

	import type { BoxGeometry, CapsuleGeometry, Geometry, Shapes, SphereGeometry } from '../../types'

	import { createGeometry } from '../../lib/create-geometry'

	interface Props {
		/** The geometry to edit. */
		geometry: Geometry
		oninput: (geometry: Geometry) => void
	}

	const { geometry, oninput }: Props = $props()

	const getNormalizedSize = () => {
		switch (geometry.type) {
			case 'box': {
				return geometry.length > geometry.height ? geometry.length / 2 : geometry.height / 2
			}
			case 'sphere': {
				return geometry.radius
			}
			case 'capsule': {
				return geometry.length
			}
		}
	}

	const DIMENSION_STEP_METERS = 0.1

	const SHAPE_ITEMS = [
		{ value: 'box', label: 'Box' },
		{ value: 'sphere', label: 'Sphere' },
		{ value: 'capsule', label: 'Capsule' },
	]

	const isShape = (value: string): value is Shapes =>
		value === 'box' || value === 'sphere' || value === 'capsule'

	const handleShapeSelect = (value: string) => {
		if (!isShape(value) || value === geometry.type) {
			return
		}
		const currentSize = getNormalizedSize()
		const currentRotation = geometry.pose.orientationVector.th
		oninput(createGeometry(value, currentSize, currentRotation))
	}

	const handleBoxInput = (box: BoxGeometry, size: PointValue) => {
		oninput({ ...box, length: size.x, width: size.y, height: size.z ?? box.height })
	}

	const handleCapsuleInput = (capsule: CapsuleGeometry, size: PointValue) => {
		oninput({ ...capsule, radius: size.x, length: size.y })
	}

	const handleRadiusInput = (sphere: SphereGeometry, radius: number | undefined) => {
		if (radius !== undefined) {
			oninput({ ...sphere, radius })
		}
	}
</script>

<div class="my-2 flex flex-col gap-2">
	<ToggleButtons
		label="Shape"
		items={SHAPE_ITEMS}
		bind:value={() => geometry.type, handleShapeSelect}
	/>

	{#if geometry.type === 'box'}
		{@const box = geometry}
		<Point
			label="Length, width, height (m)"
			labels={{ x: 'L', y: 'W', z: 'H' }}
			suffix="m"
			step={DIMENSION_STEP_METERS}
			bind:value={
				() => ({ x: box.length, y: box.width, z: box.height }), (size) => handleBoxInput(box, size)
			}
		/>
	{:else if geometry.type === 'capsule'}
		{@const capsule = geometry}
		<Point
			label="Radius, length (m)"
			labels={{ x: 'R', y: 'L' }}
			suffix="m"
			step={DIMENSION_STEP_METERS}
			bind:value={
				() => ({ x: capsule.radius, y: capsule.length }),
				(size) => handleCapsuleInput(capsule, size)
			}
		/>
	{:else if geometry.type === 'sphere'}
		{@const sphere = geometry}
		<NumberField
			label="Radius (m)"
			suffix="m"
			step={DIMENSION_STEP_METERS}
			bind:value={() => sphere.radius, (radius) => handleRadiusInput(sphere, radius)}
		/>
	{/if}
</div>
