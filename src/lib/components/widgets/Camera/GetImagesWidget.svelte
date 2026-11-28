<script lang="ts">
	import type { MediaFrameAddToDataset } from '#lib/components/MediaFrame/media-frame-capture.js'

	import { TextField } from '@viamrobotics/prime-controls'
	import { CameraClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { useAddToDatasetAction } from '#lib/add-image-to-dataset.js'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import MediaFrame from '#lib/components/MediaFrame/MediaFrame.svelte'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import { getBlobForViamDepth, VIAM_DEPTH_MIME_TYPE } from './decode-viam-depth'
	import { depthPreviewFor } from './depth-preview'

	interface Props {
		partID: string
		resourceName: string
	}

	/** One returned image, with the preview URL the widget owns and revokes. */
	interface ImageFrame {
		sourceName: string
		mimeType: string
		bytes: Uint8Array
		previewUrl: string | undefined
		capturedAt: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'
	const DEFAULT_ASPECT_RATIO = '16 / 9'
	const SOURCES_PLACEHOLDER = 'color, depth'
	const SOURCES_HINT = 'Source names, separated by commas. Leave empty to get every source.'
	const BUSY_REASON = 'Wait for the images in flight to finish.'
	const NAME_SEPARATOR = ','

	const client = createResourceClient(
		CameraClient,
		() => partID,
		() => resourceName
	)

	let sourceNamesText = $state('')
	let frames = $state.raw<ImageFrame[] | undefined>(undefined)
	let aspectRatios = $state<Record<number, string>>({})

	const filterSourceNames = $derived(
		sourceNamesText
			.split(NAME_SEPARATOR)
			.map((name) => name.trim())
			.filter((name) => name !== '')
	)

	const filterArgs = $derived.by(
		(): Parameters<CameraClient['getImages']> =>
			filterSourceNames.length === 0 ? [] : [filterSourceNames]
	)

	const imagesQuery = createResourceQuery(
		client,
		'getImages',
		() => filterArgs,
		() => ({ enabled: false, refetchInterval: false })
	)

	const pad = (value: number) => String(value).padStart(2, '0')

	const formatCaptureTime = (date: Date | undefined) => {
		if (date === undefined) return MISSING_VALUE
		const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
		return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
	}

	const previewBlobFor = async (bytes: Uint8Array, mimeType: string) => {
		if (mimeType === VIAM_DEPTH_MIME_TYPE) return getBlobForViamDepth(bytes)
		return new Blob([new Uint8Array(bytes)], { type: mimeType })
	}

	let previewUrls: string[] = []

	const revokePreviews = () => {
		for (const url of previewUrls) URL.revokeObjectURL(url)
		previewUrls = []
	}

	$effect(() => revokePreviews)

	type GetImagesResponse = NonNullable<typeof imagesQuery.data>

	const toFrames = (response: GetImagesResponse) =>
		Promise.all(
			response.images.map(async (image): Promise<ImageFrame> => {
				const bytes = new Uint8Array(image.image)
				const blob = await previewBlobFor(bytes, image.mimeType)
				const previewUrl = blob ? URL.createObjectURL(blob) : undefined
				return {
					sourceName: image.sourceName,
					mimeType: image.mimeType,
					bytes,
					previewUrl,
					capturedAt: formatCaptureTime(response.metadata?.capturedAt?.toDate()),
				}
			})
		)

	let isGettingImages = $state(false)

	const showImages = async (data: GetImagesResponse) => {
		const next = await toFrames(data)
		revokePreviews()
		previewUrls = next.flatMap((frame) => (frame.previewUrl ? [frame.previewUrl] : []))
		aspectRatios = {}
		frames = next
	}

	let hasLastFetchFailed = $state(false)

	// The button stays focusable while a fetch is in flight, so a press then is dropped here.
	const getImages = async () => {
		if (isGettingImages) return
		isGettingImages = true
		hasLastFetchFailed = false
		try {
			const { data, error } = await imagesQuery.refetch()
			if (error || !data) {
				hasLastFetchFailed = true
				return
			}
			await showImages(data)
		} finally {
			isGettingImages = false
		}
	}

	const statusText = $derived.by(() => {
		if (isGettingImages) return 'Getting images.'
		return hasLastFetchFailed ? 'Get images failed' : ''
	})

	const metadataLine = (frame: ImageFrame) =>
		[frame.sourceName || MISSING_VALUE, frame.mimeType || MISSING_VALUE, frame.capturedAt].join(
			' · '
		)

	const getAddToDatasetAction = useAddToDatasetAction(() => ({
		partID,
		cameraName: resourceName,
		methodName: 'getImages',
	}))

	const addToDatasetFor = (frame: ImageFrame): MediaFrameAddToDataset | undefined => {
		const action = getAddToDatasetAction()
		if (!action) return undefined
		return {
			...action,
			capture: async () => ({
				binaryData: frame.bytes,
				mimeType: frame.mimeType,
				preview: await depthPreviewFor(frame.bytes, frame.mimeType),
			}),
		}
	}

	const captureFor = (frame: ImageFrame) => () =>
		Promise.resolve({ binaryData: frame.bytes, mimeType: frame.mimeType })
</script>

<ApiSection
	method="GetImages"
	api={ResourceTriplets.Camera}
	queries={[imagesQuery]}
	class="grow flex-col gap-3"
>
	<div class="flex flex-col gap-2">
		<TextField
			label="Sources"
			hint={SOURCES_HINT}
			placeholder={SOURCES_PLACEHOLDER}
			bind:value={sourceNamesText}
		/>
		<HeldBack reason={isGettingImages ? BUSY_REASON : undefined}>
			{#snippet children(heldBack)}
				<button
					type="button"
					class="button button-compact"
					{...heldBack}
					onclick={getImages}
				>
					{#if isGettingImages}
						<span
							class="progress-dots"
							aria-hidden="true"
						></span>
					{/if}
					Get images
				</button>
			{/snippet}
		</HeldBack>
		<StatusLine text={statusText} />
	</div>

	{#if frames === undefined}
		<p class="text-subtle-2 text-xs">No images yet. Press Get images to fetch them.</p>
	{:else}
		{#each frames as frame, index (index)}
			<div class="-mx-4 flex flex-col gap-2">
				<MediaFrame
					label={`GetImages ${frame.sourceName || resourceName}`}
					aspectRatio={aspectRatios[index] ?? DEFAULT_ASPECT_RATIO}
					screenshot={captureFor(frame)}
					addToDataset={addToDatasetFor(frame)}
				>
					{#snippet media()}
						{#if frame.previewUrl}
							<img
								src={frame.previewUrl}
								alt={`${frame.sourceName || resourceName} image`}
								class="size-full object-contain"
								onload={(event) => {
									const image = event.currentTarget
									if (!(image instanceof HTMLImageElement)) return
									const { naturalWidth, naturalHeight } = image
									if (naturalWidth > 0 && naturalHeight > 0) {
										aspectRatios[index] = `${naturalWidth} / ${naturalHeight}`
									}
								}}
							/>
						{:else}
							<p class="text-subtle-2 p-2 text-xs">This image cannot be previewed</p>
						{/if}
					{/snippet}
				</MediaFrame>
				<p class="text-subtle-2 px-4 text-xs">{metadataLine(frame)}</p>
			</div>
		{/each}
	{/if}
</ApiSection>
