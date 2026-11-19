<script lang="ts">
	import { Select } from '@viamrobotics/prime-controls'
	import { CameraClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import type { MediaFrameAddToDataset } from '$lib/components/media-frame/media-frame-capture'

	import { useAddToDatasetAction } from '$lib/add-image-to-dataset'
	import ApiSection from '$lib/components/api-section.svelte'
	import MediaFrame from '$lib/components/media-frame/media-frame.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { getBlobForViamDepth, VIAM_DEPTH_MIME_TYPE } from './decode-viam-depth'
	import { getSourceNames } from './get-source-names'

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
	// An item value is never empty, because bits-ui reads `''` as nothing selected.
	// Source items carry a prefix, so none collides with `all`.
	const ALL_SOURCES = 'all'
	const SOURCE_PREFIX = 'source:'
	const ALL_SOURCES_LABEL = 'All sources'

	const client = createResourceClient(
		CameraClient,
		() => partID,
		() => resourceName
	)

	let selectedSource = $state(ALL_SOURCES)
	let knownSources = $state<string[]>([])
	let frames = $state.raw<ImageFrame[] | undefined>(undefined)
	let aspectRatios = $state<Record<number, string>>({})

	const sourceItems = $derived([
		{ value: ALL_SOURCES, label: ALL_SOURCES_LABEL },
		...knownSources.map((name) => ({ value: `${SOURCE_PREFIX}${name}`, label: name })),
	])

	const getSelectedSource = () => selectedSource
	const selectSource = (next: string | undefined) => {
		if (next !== undefined) selectedSource = next
	}

	const filterSourceNames = (itemValue: string) =>
		itemValue.startsWith(SOURCE_PREFIX) ? [itemValue.slice(SOURCE_PREFIX.length)] : []

	const filterArgs = $derived.by((): Parameters<CameraClient['getImages']> => {
		const names = filterSourceNames(selectedSource)
		return names.length === 0 ? [] : [names]
	})

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
				if (previewUrl) previewUrls.push(previewUrl)
				return {
					sourceName: image.sourceName,
					mimeType: image.mimeType,
					bytes,
					previewUrl,
					capturedAt: formatCaptureTime(response.metadata?.capturedAt?.toDate()),
				}
			})
		)

	const getImages = async () => {
		const { data, error } = await imagesQuery.refetch()
		if (error || !data) return

		const next = await toFrames(data)
		revokePreviews()
		previewUrls = next.flatMap((frame) => (frame.previewUrl ? [frame.previewUrl] : []))
		knownSources = [...new Set([...knownSources, ...getSourceNames(data.images)])]
		aspectRatios = {}
		frames = next
	}

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
			capture: () => Promise.resolve({ binaryData: frame.bytes, mimeType: frame.mimeType }),
		}
	}

	const captureFor = (frame: ImageFrame) => () =>
		Promise.resolve({ binaryData: frame.bytes, mimeType: frame.mimeType })

	const sourceLabelId = $props.id()
</script>

<ApiSection
	method="GetImages"
	api={ResourceTriplets.Camera}
	queries={[imagesQuery]}
	class="grow flex-col gap-3"
>
	<div class="flex flex-col gap-2">
		<div class="flex items-center gap-2">
			<span
				id={sourceLabelId}
				class="text-subtle-1 shrink-0 text-xs"
			>
				Source
			</span>
			<div class="max-w-50 min-w-0 flex-1">
				<Select
					items={sourceItems}
					bind:value={getSelectedSource, selectSource}
					aria-labelledby={sourceLabelId}
				/>
			</div>
		</div>
		<button
			type="button"
			class="button button-compact"
			onclick={getImages}
		>
			Get images
		</button>
	</div>

	{#if frames === undefined}
		<p class="text-subtle-2 text-xs">{MISSING_VALUE}</p>
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
