<script lang="ts">
	import { T } from '@threlte/core'
	import { OrbitControls } from '@threlte/extras'
	import { BackSide, type Texture } from 'three'

	import type { PanoCoverage } from './get-pano-coverage-from-xmp'

	interface Props {
		coverage?: PanoCoverage | null
		/** Texture to paint on the inside of the sphere (image frame or live video). */
		map?: Texture
	}

	const { coverage = null, map }: Props = $props()

	// Default to a full sphere so a missing coverage renders the original 360° view.
	// `kind` is irrelevant to geometry; only the angles are consumed below.
	const sphere = $derived(
		coverage ?? { phiStart: 0, phiLength: Math.PI * 2, thetaStart: 0, thetaLength: Math.PI }
	)

	// A band that covers less than the full pole-to-pole sweep is a horizontal-only
	// view: fitting the camera's vertical FOV to the band removes the empty sphere
	// above and below it, and locking the vertical tilt keeps the user from swinging
	// toward those empty caps. A full sphere keeps the original free 75° view.
	const isPartialBand = $derived(sphere.thetaLength < Math.PI - 1e-3)
	const verticalCenter = $derived(sphere.thetaStart + sphere.thetaLength / 2)
	const fov = $derived(isPartialBand ? (sphere.thetaLength * 180) / Math.PI : 75)
</script>

<T.PerspectiveCamera
	makeDefault
	position={[0, 0, 0.1]}
	{fov}
>
	<OrbitControls
		enableZoom={true}
		enablePan={false}
		minPolarAngle={isPartialBand ? verticalCenter : 0}
		maxPolarAngle={isPartialBand ? verticalCenter : Math.PI}
	/>
</T.PerspectiveCamera>

{#if map}
	<T.Mesh scale={[-1, 1, 1]}>
		<T.SphereGeometry
			args={[500, 60, 40, sphere.phiStart, sphere.phiLength, sphere.thetaStart, sphere.thetaLength]}
		/>
		<T.MeshBasicMaterial
			{map}
			side={BackSide}
		/>
	</T.Mesh>
{/if}
