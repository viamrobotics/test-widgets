<script lang="ts">
	import type { PointCloudObject } from '@viamrobotics/sdk'
	import type { OrbitControls as OrbitControlsType } from 'three/examples/jsm/controls/OrbitControls.js'

	import { T, useThrelte } from '@threlte/core'
	import { OrbitControls } from '@threlte/extras'
	import { Color, Vector4 } from 'three'
	import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js'

	import type { MediaFrameCapture } from '$lib/components/media-frame/media-frame-capture'

	interface Props {
		object: PointCloudObject
		/** Set by the scene to a function that captures this view as a PNG. Bind it to read it. */
		capture?: () => Promise<MediaFrameCapture>
	}

	let { object, capture = $bindable() }: Props = $props()

	const { scene, invalidate, renderer, camera, dom, canvas } = useThrelte()
	scene.background = new Color(0xe0_e0_e0)

	const loader = new PCDLoader()

	let controlsRef = $state<OrbitControlsType>()

	const points = $derived.by(() => {
		const dataCopy = new Uint8Array(object.pointCloud)
		return loader.parse(dataCopy.buffer)
	})

	const boundingInfo = $derived.by(() => {
		if (!points) return undefined

		points.geometry.computeBoundingSphere()
		const sphere = points.geometry.boundingSphere
		if (!sphere) return undefined

		return {
			center: sphere.center.clone(),
			distance: sphere.radius * 2.5,
		}
	})

	const cameraPosition = $derived.by((): [number, number, number] => {
		if (!boundingInfo) return [0, 0, 2]
		const { center, distance } = boundingInfo
		return [center.x, center.y, center.z + distance]
	})

	$effect(() => {
		if (controlsRef && boundingInfo) {
			controlsRef.target.copy(boundingInfo.center)
			controlsRef.update()
			invalidate()
		}
	})

	const drawViewOnly = (left: number, bottom: number, width: number, height: number) => {
		const viewport = renderer.getViewport(new Vector4())
		const scissor = renderer.getScissor(new Vector4())
		const scissorTest = renderer.getScissorTest()

		renderer.setViewport(left, bottom, width, height)
		renderer.setScissor(left, bottom, width, height)
		renderer.setScissorTest(true)
		renderer.render(scene, camera.current)

		renderer.setViewport(viewport)
		renderer.setScissor(scissor)
		renderer.setScissorTest(scissorTest)
	}

	// Every view shares one on-demand canvas, which clears its buffer once shown, so this draws the
	// view and copies its cell in the same task, then redraws the rest.
	const captureView = async (): Promise<MediaFrameCapture> => {
		const cell = dom.getBoundingClientRect()
		const bounds = canvas.getBoundingClientRect()
		const left = cell.left - bounds.left
		const top = cell.top - bounds.top
		const pixelRatio = renderer.getPixelRatio()

		drawViewOnly(left, bounds.bottom - cell.bottom, cell.width, cell.height)

		const width = Math.round(cell.width * pixelRatio)
		const height = Math.round(cell.height * pixelRatio)
		const image = new OffscreenCanvas(width, height)
		const context = image.getContext('2d')
		if (!context) throw new Error('No 2D context to copy the object point cloud into')
		context.drawImage(
			canvas,
			left * pixelRatio,
			top * pixelRatio,
			width,
			height,
			0,
			0,
			width,
			height
		)
		invalidate()

		const blob = await image.convertToBlob({ type: 'image/png' })
		return { binaryData: new Uint8Array(await blob.arrayBuffer()), mimeType: blob.type }
	}

	capture = captureView
</script>

<T.PerspectiveCamera
	makeDefault
	position={cameraPosition}
	fov={50}
	near={0.001}
	far={1000}
>
	<OrbitControls bind:ref={controlsRef} />
</T.PerspectiveCamera>

<T.HemisphereLight args={[0xaa_aa_aa, 0x44_44_44, 3]} />
<T.DirectionalLight
	args={[0xff_ff_ff, 1.5]}
	position={[1, 1, 1]}
/>

{#if points}
	<T is={points} />
{/if}
