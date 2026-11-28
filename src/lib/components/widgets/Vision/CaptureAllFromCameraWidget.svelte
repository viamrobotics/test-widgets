<script lang="ts">
	import type { MediaFrameCapture } from '#lib/components/MediaFrame/media-frame-capture.js'

	import { mdiPlayCircleOutline } from '@mdi/js'
	import { Icon, MultiSelect } from '@viamrobotics/prime-ui'
	import { VisionClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { useAddToDatasetAction } from '#lib/add-image-to-dataset.js'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import MediaFrame from '#lib/components/MediaFrame/MediaFrame.svelte'
	import ReadingsList from '#lib/components/ReadingsList.svelte'
	import { Section } from '#lib/components/Section/index.js'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import { createCameraChoice } from './camera-choice.svelte'
	import CameraSelect from './CameraSelect.svelte'
	import ClassificationList from './ClassificationList.svelte'
	import Detection3dList from './Detection3dList.svelte'
	import DetectionList from './DetectionList.svelte'
	import ObjectList from './ObjectList.svelte'

	interface Props {
		partID: string
		resourceName: string
		/** The camera to read. Set, the widget draws no `Camera` row, and `''` is the service's default camera. */
		cameraName?: string
	}

	const { partID, resourceName, cameraName }: Props = $props()

	const METHOD = 'CaptureAllFromCamera'
	const BUSY_REASON = 'Wait for the capture in flight to finish.'
	const PROPERTIES_REASON = 'Wait for GetProperties to answer.'

	type VisionProperties = Awaited<ReturnType<VisionClient['getProperties']>>

	interface ReturnFlag {
		value: string
		label: string
		/** `undefined` until GetProperties answers. */
		isSupported: (properties: VisionProperties | undefined) => boolean | undefined
	}

	// GetProperties reports no image capability, so an image is always supported.
	const IMAGE: ReturnFlag = { value: 'image', label: 'Image', isSupported: () => true }
	const DETECTIONS: ReturnFlag = {
		value: 'detections',
		label: 'Detections',
		isSupported: (properties) => properties?.detectionsSupported,
	}
	const CLASSIFICATIONS: ReturnFlag = {
		value: 'classifications',
		label: 'Classifications',
		isSupported: (properties) => properties?.classificationsSupported,
	}
	const OBJECT_POINT_CLOUDS: ReturnFlag = {
		value: 'object-point-clouds',
		label: 'Object point clouds',
		isSupported: (properties) => properties?.objectPointCloudsSupported,
	}
	const DETECTIONS_3D: ReturnFlag = {
		value: 'detections-3d',
		label: '3D detections',
		isSupported: (properties) => properties?.detections3dSupported,
	}
	const RETURN_FLAGS = [IMAGE, DETECTIONS, CLASSIFICATIONS, OBJECT_POINT_CLOUDS, DETECTIONS_3D]

	const choice = createCameraChoice(() => partID)
	const activeCameraName = $derived(cameraName ?? choice.cameraName)

	const client = createResourceClient(
		VisionClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties')

	const isUnsupported = (flag: ReturnFlag) => flag.isSupported(propertiesQuery.data) === false

	const returnItems = $derived(
		RETURN_FLAGS.map((flag) => ({
			value: flag.value,
			label: flag.label,
			disabled: isUnsupported(flag),
		}))
	)

	// The user's own pick. Until there is one, every flag GetProperties reports supported is on.
	let pickedFlags = $state<string[]>()

	const defaultFlags = $derived(
		RETURN_FLAGS.filter((flag) => flag.isSupported(propertiesQuery.data) === true).map(
			(flag) => flag.value
		)
	)

	const selectedFlags = $derived(
		(pickedFlags ?? defaultFlags).filter((value) =>
			RETURN_FLAGS.some((flag) => flag.value === value && !isUnsupported(flag))
		)
	)

	const isReturning = (flag: ReturnFlag) => selectedFlags.includes(flag.value)

	const captureQuery = createResourceQuery(
		client,
		'captureAllFromCamera',
		(): Parameters<VisionClient['captureAllFromCamera']> => [
			activeCameraName,
			{
				returnImage: isReturning(IMAGE),
				returnDetections: isReturning(DETECTIONS),
				returnClassifications: isReturning(CLASSIFICATIONS),
				returnObjectPointClouds: isReturning(OBJECT_POINT_CLOUDS),
				returnDetections3d: isReturning(DETECTIONS_3D),
			},
		],
		{ enabled: false }
	)

	let hasLastCaptureFailed = $state(false)

	// The capture arguments follow the flags GetProperties reports, so a capture sent before it
	// settles would be dropped when the query key moves.
	const blockedReason = $derived.by(() => {
		if (captureQuery.isFetching) return BUSY_REASON
		return propertiesQuery.isSuccess || propertiesQuery.isError ? undefined : PROPERTIES_REASON
	})

	// The button stays focusable while it is held back, so a press then is dropped here.
	const capture = async () => {
		if (blockedReason) return
		hasLastCaptureFailed = false
		const { error } = await captureQuery.refetch()
		hasLastCaptureFailed = Boolean(error)
	}

	const statusText = $derived.by(() => {
		if (captureQuery.isFetching) return 'Capturing.'
		return hasLastCaptureFailed ? 'Capture failed' : ''
	})

	const extra = $derived.by((): Record<string, unknown> | undefined => {
		const json = captureQuery.data?.extra?.toJson()
		return json !== null && typeof json === 'object' && !Array.isArray(json) ? json : undefined
	})

	const image = $derived(captureQuery.data?.image)

	const imageUrl = $derived(
		image
			? URL.createObjectURL(new Blob([new Uint8Array(image.image)], { type: image.mimeType }))
			: ''
	)

	$effect(() => {
		const url = imageUrl
		return () => {
			URL.revokeObjectURL(url)
		}
	})

	let naturalSize = $state<{ width: number; height: number }>()

	const handleImageLoad = (event: Event) => {
		if (!(event.currentTarget instanceof HTMLImageElement)) return
		naturalSize = {
			width: event.currentTarget.naturalWidth,
			height: event.currentTarget.naturalHeight,
		}
	}

	const aspectRatio = $derived(
		naturalSize ? `${naturalSize.width.toString()} / ${naturalSize.height.toString()}` : undefined
	)

	// The response's own bytes, so Screenshot and Add to dataset keep its format and resolution.
	const captureImage = async (): Promise<MediaFrameCapture> => {
		if (!image) throw new Error('No image has been captured yet')
		return { binaryData: image.image, mimeType: image.mimeType }
	}

	// `Default camera` sends an empty name, and the service resolves it to its own default camera.
	const capturedCameraName = $derived(
		activeCameraName || (propertiesQuery.data?.defaultCamera ?? '')
	)

	const getAddToDatasetAction = useAddToDatasetAction(() => ({
		partID,
		cameraName: capturedCameraName,
		methodName: 'captureAllFromCamera',
	}))

	const addToDataset = $derived.by(() => {
		const action = getAddToDatasetAction()
		if (!action) return undefined
		return { ...action, capture: captureImage }
	})

	const returnLabelId = $props.id()
</script>

{#snippet listHeading(text: string)}
	<h4 class="text-default text-xs font-semibold">{text}</h4>
{/snippet}

<ApiSection
	method={METHOD}
	api={ResourceTriplets.Vision}
	queries={[propertiesQuery, captureQuery]}
	class="grow flex-col gap-4"
>
	<div class="flex flex-col gap-2">
		{#if cameraName === undefined}
			<CameraSelect {choice} />
		{/if}

		<div class="flex max-w-60 min-w-40 items-center gap-2">
			<span
				id={returnLabelId}
				class="text-subtle-1 shrink-0 text-xs"
			>
				Return
			</span>
			<div class="min-w-0 flex-1">
				<MultiSelect
					items={returnItems}
					bind:value={() => selectedFlags, (next) => (pickedFlags = next)}
				>
					<MultiSelect.Trigger
						aria-labelledby={returnLabelId}
						class="w-full"
					>
						<MultiSelect.Value placeholder="None" />
					</MultiSelect.Trigger>
					<MultiSelect.Content>
						<MultiSelect.Viewport>
							<MultiSelect.Items />
						</MultiSelect.Viewport>
					</MultiSelect.Content>
				</MultiSelect>
			</div>
		</div>

		<div class="flex justify-end">
			<HeldBack reason={blockedReason}>
				{#snippet children(heldBack)}
					<button
						type="button"
						class="button button-compact"
						{...heldBack}
						onclick={capture}
					>
						<Icon
							icon={mdiPlayCircleOutline}
							size="sm"
						/>
						Capture
					</button>
				{/snippet}
			</HeldBack>
		</div>
		<StatusLine text={statusText} />
	</div>

	{#if image}
		<MediaFrame
			label={METHOD}
			{aspectRatio}
			screenshot={captureImage}
			{addToDataset}
		>
			{#snippet media()}
				<img
					src={imageUrl}
					alt="Captured from {capturedCameraName || 'the default camera'}"
					class="block h-full w-full object-contain"
					onload={handleImageLoad}
				/>
			{/snippet}
		</MediaFrame>
	{/if}

	<div class="flex flex-col gap-2">
		{#if !isUnsupported(DETECTIONS)}
			{@const detections = captureQuery.data?.detections ?? []}
			{#if detections.length > 0}
				{@render listHeading('Detections')}
			{/if}
			<DetectionList {detections} />
		{/if}

		{#if !isUnsupported(CLASSIFICATIONS)}
			{@const classifications = captureQuery.data?.classifications ?? []}
			{#if classifications.length > 0}
				{@render listHeading('Classifications')}
			{/if}
			<ClassificationList {classifications} />
		{/if}

		{#if !isUnsupported(OBJECT_POINT_CLOUDS)}
			{@const objects = captureQuery.data?.objectPointClouds ?? []}
			{#if objects.length > 0}
				{@render listHeading('Objects')}
			{/if}
			<ObjectList
				{objects}
				withPreview
			/>
		{/if}

		{#if !isUnsupported(DETECTIONS_3D)}
			{@const detections3d = captureQuery.data?.detections3d ?? []}
			{#if detections3d.length > 0}
				{@render listHeading('3D detections')}
			{/if}
			<Detection3dList detections={detections3d} />
		{/if}

		{#if extra}
			{@render listHeading('Extra')}
			<ReadingsList
				data={extra}
				showCopy={false}
			/>
		{/if}

		{#if captureQuery.data === undefined}
			<Section.Text>Press Capture to read the camera</Section.Text>
		{/if}
	</div>
</ApiSection>
