<script lang="ts">
	import type { cameraApi, Classification, Detection } from '@viamrobotics/sdk'
	import type {
		MediaFrameAddToDataset,
		MediaFrameCapture,
		MediaFramePictureInPicture,
	} from '#lib/components/MediaFrame/media-frame-capture.js'
	import type { Snippet } from 'svelte'

	import { Canvas } from '@threlte/core'
	import { Folder, Panel } from '@viamrobotics/prime-controls'
	import { Progress } from '@viamrobotics/prime-ui'
	import MediaFrame from '#lib/components/MediaFrame/MediaFrame.svelte'
	import { useMeasureFps } from '#lib/fps.svelte.js'
	import { provideFontFamilies } from 'threlte-uikit'

	import { provideDetectionsContext } from './context.svelte'
	import { drawDetectionBoxes } from './draw-detection-boxes'
	import { getImageSize, type Size } from './get-image-size'
	import Legend from './Legend.svelte'
	import { getPublicSansFont } from './public-sans-font'
	import Scene from './Scene.svelte'

	interface Props {
		/** Names the frame, such as the section's method. */
		label: string
		data?: {
			detections: Detection[]
			image: ({ image: Uint8Array } & Omit<cameraApi.Image, 'image'>) | undefined
			classifications: Classification[]
		}
		detectionsSupported: boolean
		classificationsSupported: boolean
		/** With `onStart`, `false` shows the frame's splash. */
		running: boolean
		onStart: () => void
		/** Bind it to show the frame's `Start feed automatically` checkbox. */
		startAutomatically?: boolean
		/** Names the raw frame's stream in the pip context. */
		pictureInPictureKey: string
		addToDataset?: MediaFrameAddToDataset
		/** The host's controls, after the frame's action row. */
		children?: Snippet
	}

	let {
		label,
		data,
		detectionsSupported,
		classificationsSupported,
		running,
		onStart,
		startAutomatically = $bindable(),
		pictureInPictureKey,
		addToDataset,
		children,
	}: Props = $props()

	const detections = provideDetectionsContext(() => data?.detections ?? [])

	const img = document.createElement('img')

	let naturalSize = $state<{ width: number; height: number }>()

	const pictureInPictureCanvas = document.createElement('canvas')
	let pictureInPictureStream: MediaStream | undefined

	const drawPictureInPictureFrame = () => {
		if (!pictureInPictureStream || img.naturalWidth === 0) return
		pictureInPictureCanvas.width = img.naturalWidth
		pictureInPictureCanvas.height = img.naturalHeight
		pictureInPictureCanvas.getContext('2d')?.drawImage(img, 0, 0)
	}

	const fps = useMeasureFps()

	// Each frame arrives as a new source, so a load is one frame for the fps badge.
	const handleImageLoad = () => {
		fps.measure()
		naturalSize = { width: img.naturalWidth, height: img.naturalHeight }
		drawPictureInPictureFrame()
	}

	$effect(() => {
		img.addEventListener('load', handleImageLoad)
		return () => img.removeEventListener('load', handleImageLoad)
	})

	$effect(() => () => {
		for (const track of pictureInPictureStream?.getTracks() ?? []) track.stop()
	})

	const getImageSrc = (image: string | Uint8Array | undefined) => {
		if (typeof image === 'string') {
			return `data:image/jpeg;base64,${image}`
		} else if (image !== undefined) {
			return URL.createObjectURL(new Blob([new Uint8Array(image)], { type: 'image/jpeg' }))
		}

		return ''
	}

	const src = $derived(getImageSrc(data?.image?.image))

	// The hidden element decodes each frame for its natural size, the screenshot, and picture-in-picture.
	$effect.pre(() => {
		const frameSrc = src
		img.src = frameSrc
		return () => {
			if (frameSrc.startsWith('blob:')) URL.revokeObjectURL(frameSrc)
		}
	})

	provideFontFamilies({
		publicSans: {
			light: getPublicSansFont(),
			medium: getPublicSansFont(),
			'extra-light': getPublicSansFont(),
		},
	})

	let containerWidth = $state(0)

	// Tailwind's @2xl container width: the legend starts open from it and collapsed below it.
	const LEGEND_OPEN_WIDTH_PX = 672

	const isWide = $derived(containerWidth >= LEGEND_OPEN_WIDTH_PX)

	// Follows the breakpoint, and a person's toggle holds until the width crosses it again.
	let isLegendOpen = $derived(isWide)

	// The frame's media box spans its width at the image's ratio, so the boxes scale by the same factor.
	const size = $derived.by((): Size | undefined => {
		if (!naturalSize || naturalSize.width === 0 || naturalSize.height === 0) return undefined
		if (containerWidth === 0) return undefined
		return getImageSize(img, {
			maxWidth: containerWidth,
			maxHeight: (containerWidth * naturalSize.height) / naturalSize.width,
		})
	})

	const aspectRatio = $derived(
		naturalSize ? `${naturalSize.width.toString()} / ${naturalSize.height.toString()}` : undefined
	)

	const canvasToPng = async (canvas: HTMLCanvasElement): Promise<Blob> => {
		const blob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob(resolve, 'image/png')
		})
		if (!blob) throw new Error('The screenshot could not be encoded')
		return blob
	}

	const isDetectionActive = (detection: { id: string }) =>
		detections.selected === detection.id || detections.hovered.has(detection.id)

	// What is on screen, the frame with its boxes, at the frame's own resolution.
	const screenshot = async (): Promise<MediaFrameCapture> => {
		if (img.naturalWidth === 0 || !size) throw new Error('No frame has been captured yet')
		const canvas = document.createElement('canvas')
		canvas.width = img.naturalWidth
		canvas.height = img.naturalHeight
		const context = canvas.getContext('2d')
		if (!context) throw new Error('The screenshot canvas has no 2D context')
		context.drawImage(img, 0, 0)
		drawDetectionBoxes(context, detections.current, {
			isActive: isDetectionActive,
			factor: size.factor,
		})
		const blob = await canvasToPng(canvas)
		return { binaryData: new Uint8Array(await blob.arrayBuffer()), mimeType: 'image/png' }
	}

	// Picture-in-picture plays the raw frame. The boxes stay in the widget.
	const pictureInPicture = $derived<MediaFramePictureInPicture>({
		key: pictureInPictureKey,
		stream: () => {
			pictureInPictureStream ??= pictureInPictureCanvas.captureStream()
			drawPictureInPictureFrame()
			return pictureInPictureStream
		},
	})
</script>

{#snippet media()}
	<div
		class="flex size-full items-center justify-center"
		bind:clientWidth={containerWidth}
	>
		{#if size}
			<div
				class="relative max-w-full shrink-0 overflow-hidden"
				style:width={`${size.width.toString()}px`}
				style:height={`${size.height.toString()}px`}
			>
				<img
					class="absolute top-0 left-0 size-full"
					alt=""
					{src}
				/>
				<Canvas>
					<Scene factor={size.factor} />
				</Canvas>
			</div>
		{:else}
			<div class="bg-light grid size-full place-content-center">
				<Progress
					label="Loading image"
					class="w-48"
				/>
			</div>
		{/if}
	</div>
{/snippet}

{#snippet legend()}
	<div
		class={[
			'absolute top-0 right-0 z-10 flex max-h-full max-w-full flex-col',
			isLegendOpen && 'w-55',
		]}
	>
		<Panel
			aria-label="Legend overlay"
			class="min-h-0 overflow-auto"
		>
			<Folder
				title="Legend"
				bind:open={
					() => isLegendOpen,
					(open) => {
						isLegendOpen = open
					}
				}
			>
				<Legend
					classifications={data?.classifications}
					{detectionsSupported}
					{classificationsSupported}
				/>
			</Folder>
		</Panel>
	</div>
{/snippet}

<MediaFrame
	{label}
	{media}
	{aspectRatio}
	overlay={size ? legend : undefined}
	{running}
	{onStart}
	bind:startAutomatically
	fps={size ? fps.current : undefined}
	{screenshot}
	{pictureInPicture}
	{addToDataset}
	{children}
/>
