<script lang="ts">
	import type { QueryObserverResult } from '@tanstack/svelte-query'
	import type { OrbitControls as OrbitControlsType } from 'three/examples/jsm/controls/OrbitControls.js'

	import { T } from '@threlte/core'
	import { OrbitControls, useTexture } from '@threlte/extras'
	import { CameraClient } from '@viamrobotics/sdk'
	import { BackSide } from 'three'

	const {
		data,
	}: { data: QueryObserverResult<Awaited<ReturnType<CameraClient['getImages']>>>['data'] } =
		$props()

	let imageUrl = $state.raw('')
	let controlsRef = $state<OrbitControlsType>()

	$effect(() => {
		const imageRecord = data?.images?.[0]
		const image = imageRecord?.image
		if (!image) {
			imageUrl = ''
			return
		}

		const imageBytes = new Uint8Array(image)
		const imageBlob = new Blob([imageBytes], {
			type: imageRecord.mimeType || 'image/jpeg',
		})
		const url = URL.createObjectURL(imageBlob)
		imageUrl = url

		return () => {
			URL.revokeObjectURL(url)
		}
	})

	const texture = $derived.by(() => (imageUrl ? useTexture(imageUrl) : null))
</script>

<T.PerspectiveCamera
	makeDefault
	position={[0, 0, 0.1]}
	fov={75}
>
	<OrbitControls
		bind:ref={controlsRef}
		enableZoom={true}
		enablePan={false}
	/>
</T.PerspectiveCamera>

{#if $texture}
	{#await texture then map}
		<T.Mesh scale={[-1, 1, 1]}>
			<T.SphereGeometry args={[500, 60, 40]} />
			<T.MeshBasicMaterial
				{map}
				side={BackSide}
			/>
		</T.Mesh>
	{/await}
{/if}

<T.AmbientLight intensity={0.5} />
<T.DirectionalLight
	position={[5, 5, 5]}
	intensity={1}
/>
