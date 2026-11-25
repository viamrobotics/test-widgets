<script lang="ts">
	import { ToggleButtons, VectorInput } from '@viamrobotics/prime-core'

	import type { Geometry, Shapes } from '../../types'

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

	const handleShapeSelect = ({ detail }: CustomEvent<string>) => {
		const currentSize = getNormalizedSize()
		const currentRotation = geometry.pose.orientationVector.th
		const nextType = detail.toLowerCase() as Shapes
		oninput(createGeometry(nextType, currentSize, currentRotation))
	}

	const handleDimensionsInput = (event: CustomEvent<Record<string, number>>) => {
		const nextGeometry = { ...geometry }

		switch (nextGeometry.type) {
			case 'box': {
				const length = event.detail['Length (m)']
				const width = event.detail['Width (m)']
				const height = event.detail['Height (m)']

				if (length !== undefined) {
					nextGeometry.length = length
				}
				if (width !== undefined) {
					nextGeometry.width = width
				}
				if (height !== undefined) {
					nextGeometry.height = height
				}
				break
			}
			case 'sphere': {
				const radius = event.detail['Radius (m)']

				if (radius !== undefined) {
					nextGeometry.radius = radius
				}
				break
			}
			case 'capsule': {
				const radius = event.detail['Radius (m)']
				const length = event.detail['Length (m)']

				if (radius !== undefined) {
					nextGeometry.radius = radius
				}
				if (length !== undefined) {
					nextGeometry.length = length
				}
				break
			}
		}

		oninput(nextGeometry)
	}

	const shapeMap = {
		box: 'Box',
		sphere: 'Sphere',
		capsule: 'Capsule',
	}
</script>

<div class="my-2 flex flex-col gap-2">
	<ToggleButtons
		options={['Box', 'Sphere', 'Capsule']}
		selected={shapeMap[geometry.type]}
		on:input={handleShapeSelect}
	>
		{#snippet legend()}
			Shape
		{/snippet}
	</ToggleButtons>

	{#if geometry.type === 'box'}
		<VectorInput
			labels={['Length (m)', 'Width (m)', 'Height (m)']}
			values={{
				'Length (m)': geometry.length,
				'Width (m)': geometry.width,
				'Height (m)': geometry.height,
			}}
			on:input={handleDimensionsInput}
		/>
	{:else if geometry.type === 'capsule'}
		<VectorInput
			labels={['Radius (m)', 'Length (m)']}
			values={{ 'Radius (m)': geometry.radius, 'Length (m)': geometry.length }}
			on:input={handleDimensionsInput}
		/>
	{:else if geometry.type === 'sphere'}
		<VectorInput
			labels={['Radius (m)']}
			values={{ 'Radius (m)': geometry.radius }}
			on:input={handleDimensionsInput}
		/>
	{/if}
</div>
