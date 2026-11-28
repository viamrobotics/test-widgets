<!--
@component
A visualizer plugin: mount it inside `<Visualizer>` and bind `capture` to get a function that
saves the drawn view as a PNG.
-->
<script lang="ts">
	import { useThrelte } from '@threlte/core/webgpu'

	import type { MediaFrameCapture } from '../../MediaFrame/media-frame-capture'

	interface Props {
		/** Set by the plugin. Bind it to read it. */
		capture?: () => Promise<MediaFrameCapture>
	}

	let { capture = $bindable() }: Props = $props()

	const { scene, camera, renderer, invalidate } = useThrelte()

	// The canvas renders on demand and clears its buffer after the frame, so this draws the scene and
	// copies the pixels in the same task.
	const captureView = async (): Promise<MediaFrameCapture> => {
		const { domElement } = renderer
		// A render before the backend is ready throws. `init` resolves at once when it already is.
		await renderer.init()
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
</script>
