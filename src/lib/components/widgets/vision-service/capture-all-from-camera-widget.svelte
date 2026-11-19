<script lang="ts">
	import type { PointCloudObject } from '@viamrobotics/sdk'

	import { mdiPlayCircleOutline } from '@mdi/js'
	import { Folder } from '@viamrobotics/prime-controls'
	import { Icon, MultiSelect } from '@viamrobotics/prime-ui'
	import { VisionClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import type { MediaFrameCapture } from '$lib/components/media-frame/media-frame-capture'

	import { useAddToDatasetAction } from '$lib/add-image-to-dataset'
	import ApiSection from '$lib/components/api-section.svelte'
	import MediaFrame from '$lib/components/media-frame/media-frame.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { createCameraChoice } from './camera-choice.svelte'
	import CameraSelect from './camera-select.svelte'
	import ClassificationList from './classification-list.svelte'
	import DetectionList from './detection-list.svelte'
	import GeometryDetails from './geometry-details.svelte'

	interface Props {
		partID: string
		resourceName: string
		/** The camera to read. Set, the widget draws no `Camera` row, and `''` is the service's default camera. */
		cameraName?: string
	}

	const { partID, resourceName, cameraName }: Props = $props()

	const METHOD = 'CaptureAllFromCamera'
	const MISSING_VALUE = '-'

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
	const RETURN_FLAGS = [IMAGE, DETECTIONS, CLASSIFICATIONS, OBJECT_POINT_CLOUDS]

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
			},
		],
		{ enabled: false }
	)

	const capture = () => {
		void captureQuery.refetch()
	}

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

	// A PCD header names its point count on a `POINTS` line, ahead of the point data.
	const PCD_HEADER_BYTES = 1024
	const POINTS_LINE = /^POINTS\s+(\d+)/m

	const countPoints = ({ pointCloud }: PointCloudObject): string => {
		const header = new TextDecoder().decode(pointCloud.subarray(0, PCD_HEADER_BYTES))
		return POINTS_LINE.exec(header)?.[1] ?? MISSING_VALUE
	}

	const returnLabelId = $props.id()
</script>

{#snippet listHeading(text: string)}
	<span class="text-default text-xs font-semibold">{text}</span>
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
			<button
				type="button"
				class="button button-compact"
				aria-busy={captureQuery.isFetching}
				onclick={capture}
			>
				<Icon
					icon={mdiPlayCircleOutline}
					size="sm"
				/>
				Capture
			</button>
		</div>
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
			{#if objects.length === 0}
				<div
					role="group"
					aria-label="Objects"
					class="flex min-w-0 items-center gap-2"
				>
					<span class="text-subtle-1 w-31 shrink-0 truncate text-xs">Objects</span>
					<span class="readout font-roboto-mono">
						<span class="readout-value">{MISSING_VALUE}</span>
					</span>
				</div>
			{:else}
				{@render listHeading('Objects')}
				<ul
					aria-label="Objects"
					class="flex flex-col gap-2"
				>
					{#each objects as object, index (index)}
						{@const objectLabel = `Object ${(index + 1).toString()}`}
						<li class="flex min-w-0 flex-col gap-1">
							<div class="flex min-w-0 items-center gap-2">
								<span
									id="{returnLabelId}-object-{index}"
									class="text-subtle-1 w-31 shrink-0 truncate text-xs"
								>
									{objectLabel}
								</span>
								<span
									role="group"
									aria-labelledby="{returnLabelId}-object-{index}"
									class="readout font-roboto-mono"
								>
									<span class="readout-value">{countPoints(object)}</span>
									<span class="readout-suffix">points</span>
								</span>
							</div>
							{#if object.geometries && object.geometries.geometries.length > 0}
								<Folder title="Geometries">
									<GeometryDetails geometries={object.geometries} />
								</Folder>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		{/if}

		{#if captureQuery.data === undefined}
			<Section.Text>Press Capture to read the camera</Section.Text>
		{/if}
	</div>
</ApiSection>
