<script lang="ts">
	import { T, useThrelte } from '@threlte/core'
	import { CameraControls, Gizmo, Grid } from '@threlte/extras'
	import { Vector3, type Vector3Tuple } from 'three'

	import type { MediaFrameCapture } from '../../media-frame/media-frame-capture'

	import Points from './points.svelte'

	interface Props {
		data: Uint8Array
		up: Vector3Tuple
		pointSize: number
		/** Set by the scene to a function that captures the drawn view as a PNG. Bind it to read it. */
		capture?: () => Promise<MediaFrameCapture>
	}

	let { data, up, pointSize, capture = $bindable() }: Props = $props()

	const { scene, camera, renderer, invalidate } = useThrelte()

	// The canvas renders on demand and clears its buffer after the frame, so this draws the scene and
	// copies the pixels in the same task.
	const captureView = async (): Promise<MediaFrameCapture> => {
		const { domElement } = renderer
		renderer.render(scene, camera.current)
		const image = new OffscreenCanvas(domElement.width, domElement.height)
		const context = image.getContext('2d')
		if (!context) throw new Error('No 2D context to copy the point cloud into')
		context.drawImage(domElement, 0, 0)
		invalidate()
		const blob = await image.convertToBlob({ type: 'image/png' })
		return { binaryData: new Uint8Array(await blob.arrayBuffer()), mimeType: blob.type }
	}

	capture = captureView

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
