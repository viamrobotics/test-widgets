<script lang="ts">
	import type { QueryObserverResult } from '@tanstack/svelte-query'
	import type { Texture } from 'three'

	import { useTexture } from '@threlte/extras'
	import { CameraClient } from '@viamrobotics/sdk'

	import type { PanoCoverage } from './get-pano-coverage-from-xmp'

	import PanoSphereScene from './pano-sphere-scene.svelte'

	interface Props {
		data: QueryObserverResult<Awaited<ReturnType<CameraClient['getImages']>>>['data']
		coverage?: PanoCoverage | null
	}

	const { data, coverage = null }: Props = $props()

	let imageUrl = $state.raw('')

	$effect(() => {
		const imageRecord = data?.images?.[0]
		const image = imageRecord?.image
		if (!image) {
			imageUrl = ''
			return
		}

		const imageBlob = new Blob([new Uint8Array(image)], {
			type: imageRecord.mimeType || 'image/jpeg',
		})
		const url = URL.createObjectURL(imageBlob)
		imageUrl = url

		return () => URL.revokeObjectURL(url)
	})

	// `useTexture` returns a store that resolves to the decoded texture (with the
	// renderer's color space already applied). Mirror its value into reactive state so
	// the sphere scene can render the camera even before the first frame loads, and so
	// `map` clears when the source goes away.
	const textureStore = $derived(imageUrl ? useTexture(imageUrl) : undefined)
	let map = $state.raw<Texture>()
	$effect(() => {
		if (!textureStore) {
			map = undefined
			return
		}

		return textureStore.subscribe((value) => {
			map = value ?? undefined
		})
	})
</script>

<PanoSphereScene
	{coverage}
	{map}
/>
