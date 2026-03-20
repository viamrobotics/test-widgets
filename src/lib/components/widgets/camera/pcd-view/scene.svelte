<script lang="ts">
	import { T } from '@threlte/core'
	import { CameraControls, Gizmo, Grid } from '@threlte/extras'
	import { Vector3, type Vector3Tuple } from 'three'

	import Points from './points.svelte'

	interface Props {
		data: Uint8Array
		up: Vector3Tuple
		pointSize: number
	}

	const { data, up, pointSize }: Props = $props()

	const upToPlane = ([x, y, z]: Vector3Tuple) => {
		if (x !== 0) {
			return 'zy'
		} else if (y !== 0) {
			return 'xz'
		} else if (z !== 0) {
			return 'xy'
		}
		throw new Error('Invalid camera direction')
	}

	const upToPosition = ([x, y, z]: Vector3Tuple): Vector3Tuple => {
		if (x !== 0) {
			return [0, 0, x * 5]
		} else if (y !== 0) {
			return [0, 0, y * 5]
		} else if (z !== 0) {
			return [0, z * 5, 0]
		}
		throw new Error('Invalid camera direction')
	}
</script>

<Points
	{data}
	{pointSize}
/>

{#key up}
	<T.PerspectiveCamera
		makeDefault
		position={upToPosition(up)}
		{up}
	>
		<CameraControls>
			<Gizmo />
		</CameraControls>
	</T.PerspectiveCamera>
{/key}

<Grid
	sectionColor="#333"
	plane={upToPlane(up)}
	infiniteGrid
	fadeOrigin={new Vector3()}
	fadeDistance={10}
/>
