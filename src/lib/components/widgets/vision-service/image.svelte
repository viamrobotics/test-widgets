<script lang="ts">
	import type { cameraApi, Classification, Detection } from '@viamrobotics/sdk'

	import { resize } from '@svelte-put/resize'
	import { Canvas } from '@threlte/core'
	import { Progress } from '@viamrobotics/prime-core'
	import { provideFontFamilies } from 'threlte-uikit'

	import { useMeasureFps } from '$lib/fps.svelte'

	import { provideDetectionsContext } from './context.svelte'
	import { getImageSize, type Size } from './get-image-size'
	import Legend from './legend.svelte'
	import Scene from './scene.svelte'

	interface Props {
		data?: {
			detections: Detection[]
			image: ({ image: Uint8Array } & Exclude<cameraApi.Image, 'image'>) | undefined
			classifications: Classification[]
		}
		detectionsSupported: boolean
		classificationsSupported: boolean
	}

	const { data, detectionsSupported, classificationsSupported }: Props = $props()

	provideDetectionsContext(() => data?.detections ?? [])

	const img = document.createElement('img')

	let src = $state('')

	const handleImageLoad = () => {
		setSize()
	}

	$effect(() => {
		img.addEventListener('load', handleImageLoad)
		return () => img.removeEventListener('load', handleImageLoad)
	})

	let url = ''

	const getImageSrc = (image: string | Uint8Array | undefined) => {
		if (typeof image === 'string') {
			return `data:image/jpeg;base64,${image}`
		} else if (image !== undefined) {
			URL.revokeObjectURL(url)
			url = URL.createObjectURL(new Blob([image], { type: 'image/jpeg' }))
			return url
		}

		return ''
	}

	$effect.pre(() => {
		img.src = getImageSrc(data?.image?.image)
		src = img.src
	})

	provideFontFamilies({
		publicSans: {
			// This must remain `/static/*` while the frontend directory still exist
			medium: '/static/fonts/public-sans.json',
		},
	})

	let container = $state<HTMLElement>()
	let size = $state<Size>()

	const setSize = () => {
		if (container) {
			size = getImageSize(img, container)
		}
	}

	$effect(() => {
		void container
		setSize()
	})

	const fps = useMeasureFps()

	let lastSrc = ''
	$effect(() => {
		if (src !== lastSrc) {
			fps.measure()
			lastSrc = src
		}
	})
</script>

<div
	class="flex h-full min-h-0 w-full min-w-0 gap-2 py-2 pl-2"
	bind:this={container}
	use:resize
	onresize={setSize}
>
	{#if !size}
		<div class="grid w-full place-content-center">
			<Progress size="large" />
		</div>
	{:else}
		<div
			class="relative max-h-full min-h-0 max-w-full"
			style:width={`${size.width.toString()}px`}
			style:height={`${size.height.toString()}px`}
		>
			<div
				class="pointer-events-none absolute bottom-2 left-2 z-10 rounded-[3px] bg-black/30 px-1 py-0.5 text-right font-mono text-xs text-white"
			>
				{fps.current.toFixed(1)}fps
			</div>
			<Canvas>
				<Scene
					{src}
					factor={size.factor}
				/>
			</Canvas>
		</div>
		<div
			class="flex grow flex-col pr-2"
			style:height={`${size.height.toString()}px`}
		>
			<Legend
				classifications={data?.classifications}
				{detectionsSupported}
				{classificationsSupported}
			/>
		</div>
	{/if}
</div>
