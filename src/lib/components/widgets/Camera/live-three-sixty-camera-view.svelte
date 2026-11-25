<script lang="ts">
	import { useThrelte } from '@threlte/core'
	import { createStreamClient } from '@viamrobotics/svelte-sdk'
	import { VideoTexture } from 'three'

	import type { PanoCoverage } from './get-pano-coverage-from-xmp'

	import PanoSphereScene from './pano-sphere-scene.svelte'

	interface Props {
		partID: string
		resourceName: string
		coverage?: PanoCoverage | null
	}

	const { partID, resourceName, coverage = null }: Props = $props()

	const stream = createStreamClient(
		() => partID,
		() => resourceName
	)
	const { renderer } = useThrelte()

	// A muted, inline, autoplaying <video> backs the VideoTexture. Mirrors the
	// element setup in live-or-polling-video.svelte; created up front like the
	// other camera widgets create their <img>/<canvas> elements.
	const video = document.createElement('video')
	video.muted = true
	video.autoplay = true
	video.playsInline = true

	let map = $state.raw<VideoTexture>()

	$effect(() => {
		const mediaStream = stream.mediaStream
		if (!mediaStream) {
			video.srcObject = null
			map = undefined
			return
		}

		video.srcObject = mediaStream
		void video.play()

		const texture = new VideoTexture(video)
		texture.colorSpace = renderer.outputColorSpace
		map = texture

		return () => {
			texture.dispose()
			video.pause()
			video.srcObject = null
			map = undefined
		}
	})
</script>

<PanoSphereScene
	{coverage}
	{map}
/>
