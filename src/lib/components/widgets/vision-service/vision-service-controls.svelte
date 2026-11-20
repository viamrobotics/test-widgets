<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { ToggleButtons } from '@viamrobotics/prime-controls'
	import { Checkbox, Field, Icon, Label, Progress } from '@viamrobotics/prime-ui'
	import { VisionClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { PersistedState } from 'runed'

	import type { MediaFrameCapture } from '$lib/components/media-frame/media-frame-capture'

	import { useAddToDatasetAction } from '$lib/add-image-to-dataset'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import {
		createRefetchIntervalStore,
		type RefetchInterval,
		RefetchIntervals,
	} from '$lib/components/refetch-interval-store.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { createCameraChoice } from './camera-choice.svelte'
	import CameraSelect from './camera-select.svelte'
	import Image from './image.svelte'
	import ObjectPointClouds from './object-point-clouds.svelte'
	import { useSlowRequest } from './use-slow-request.svelte.ts'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const CAPTURE_ALL_METHOD = 'CaptureAllFromCamera'
	const OBJECT_POINT_CLOUDS_METHOD = 'GetObjectPointClouds'
	const SLOW_MESSAGE = 'This request is taking a long time to complete.'

	// GetProperties polls at most once a second, and the image and point clouds at most every 50 ms.
	const PROPERTIES_MIN_INTERVAL_MS = 1000
	const CAPTURE_MIN_INTERVAL_MS = 50

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'vision-service'
	)

	// Object point clouds are large and slow, so they default to a manual refresh.
	const getObjectPointCloudsRefetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'vision-service-get-object-point-clouds',
		RefetchIntervals.MANUAL
	)

	// Each key stores `true` to wait, so its `Start feed automatically` checkbox shows the inverse.
	const waitToStartImage = $derived(
		new PersistedState(`vision-service-wait-to-start-feed/${partID}/${resourceName}`, false)
	)
	const waitToStartPointClouds = $derived(
		new PersistedState(`vision-service-wait-to-start-point-clouds/${partID}/${resourceName}`, true)
	)

	let isImageStarted = $derived(!waitToStartImage.current)
	let arePointCloudsStarted = $derived(!waitToStartPointClouds.current)

	const cameraChoice = createCameraChoice(() => partID)

	const DETECTIONS_MODE = 'detections'
	const OBJECT_POINT_CLOUDS_MODE = 'object-point-clouds'
	const MODE_ITEMS = [
		{ value: DETECTIONS_MODE, label: 'Detections' },
		{ value: OBJECT_POINT_CLOUDS_MODE, label: 'Object point clouds' },
	]

	let mode = $state(DETECTIONS_MODE)
	const getMode = () => mode
	// A single-choice toggle reports an empty value when its pressed option is pressed again, which keeps the mode.
	const selectMode = (next: string | undefined) => {
		if (next) mode = next
	}

	const boundedInterval = (interval: RefetchInterval, minimumMs: number): number | false =>
		interval === false ? false : Math.max(interval, minimumMs)

	// GetProperties follows the capture's refresh row, which Object point clouds mode hides, so it stops there.
	const propertiesInterval = (): number | false => {
		if (mode === OBJECT_POINT_CLOUDS_MODE) return false
		return boundedInterval(refetchInterval.current, PROPERTIES_MIN_INTERVAL_MS)
	}

	const client = createResourceClient(
		VisionClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties', () => ({
		refetchInterval: propertiesInterval(),
	}))

	// Only a report of support shows the Mode toggle, so Detections mode shows while GetProperties is unanswered.
	const supportsObjectPointClouds = $derived(
		propertiesQuery.data?.objectPointCloudsSupported === true
	)
	const isObjectPointCloudsMode = $derived(
		supportsObjectPointClouds && mode === OBJECT_POINT_CLOUDS_MODE
	)

	const captureAllQuery = createResourceQuery(
		client,
		'captureAllFromCamera',
		(): Parameters<VisionClient['captureAllFromCamera']> => [
			cameraChoice.cameraName,
			{
				returnImage: true,
				returnClassifications: Boolean(propertiesQuery.data?.classificationsSupported),
				returnDetections: Boolean(propertiesQuery.data?.detectionsSupported),
				returnObjectPointClouds: false,
			},
		],
		() => ({
			enabled: isImageStarted && !isObjectPointCloudsMode,
			refetchInterval: boundedInterval(refetchInterval.current, CAPTURE_MIN_INTERVAL_MS),
		})
	)

	const getObjectPointCloudsQuery = createResourceQuery(
		client,
		'getObjectPointClouds',
		(): Parameters<VisionClient['getObjectPointClouds']> => [cameraChoice.cameraName],
		() => ({
			enabled: arePointCloudsStarted && isObjectPointCloudsMode,
			refetchInterval: boundedInterval(
				getObjectPointCloudsRefetchInterval.current,
				CAPTURE_MIN_INTERVAL_MS
			),
		})
	)

	const captureAllSlow = useSlowRequest(() => captureAllQuery.isFetching)
	const propertiesSlow = useSlowRequest(() => propertiesQuery.isFetching)
	const objectPointCloudsSlow = useSlowRequest(() => getObjectPointCloudsQuery.isFetching)

	const detectionsSlow = $derived(captureAllSlow.isSlow || propertiesSlow.isSlow)

	const modeQueries = $derived(
		isObjectPointCloudsMode
			? [propertiesQuery, getObjectPointCloudsQuery]
			: [propertiesQuery, captureAllQuery]
	)
	const sectionErrors = useSectionErrors(() => ({ queries: modeQueries }))

	const sectionMethod = $derived(
		isObjectPointCloudsMode ? OBJECT_POINT_CLOUDS_METHOD : CAPTURE_ALL_METHOD
	)

	// `Default camera` sends an empty name, and the service resolves it to its own default camera.
	const capturedCameraName = $derived(
		cameraChoice.cameraName || (propertiesQuery.data?.defaultCamera ?? '')
	)

	const getAddToDatasetAction = useAddToDatasetAction(() => ({
		partID,
		cameraName: capturedCameraName,
		methodName: 'captureAllFromCamera',
	}))

	// The dataset gets the raw frame in its own format. The boxes are only drawn on screen.
	const captureRawFrame = async (): Promise<MediaFrameCapture> => {
		const image = captureAllQuery.data?.image
		if (!image) throw new Error('No frame has been captured yet')
		return { binaryData: image.image, mimeType: image.mimeType }
	}

	const addToDataset = $derived.by(() => {
		const action = getAddToDatasetAction()
		if (!action) return undefined
		return { ...action, capture: captureRawFrame }
	})
</script>

{#snippet splash(title: string, startLabel: string, ratioClass: string, onStart: () => void)}
	<div
		class={[
			'bg-light flex w-full flex-col items-center justify-center gap-2 p-2 text-center',
			ratioClass,
		]}
	>
		<p class="text-subtle-1 text-xs font-semibold">{title}</p>
		<button
			type="button"
			class="button button-dark"
			onclick={onStart}
		>
			<Icon
				icon={mdiPlayCircleOutline}
				size="sm"
			/>
			{startLabel}
		</button>
	</div>
{/snippet}

{#snippet slowLine()}
	<p class="text-subtle-2 px-2 text-xs italic">{SLOW_MESSAGE}</p>
{/snippet}

<ConnectionStatus {partID}>
	{#snippet connected()}
		<!-- 224 steps of 4 px is the board's 896 px maximum. -->
		<div class="mx-auto flex w-full max-w-4xl min-w-0 flex-col">
			<Section
				errorReporter={sectionErrors}
				class="min-w-0 flex-col gap-2 px-0 py-2"
			>
				<Section.Heading class="px-2">
					<Section.Method
						method={sectionMethod}
						api={ResourceTriplets.Vision}
					/>
					{#snippet aside()}
						<Section.Errors errors={sectionErrors.errors} />
					{/snippet}
				</Section.Heading>

				{#if supportsObjectPointClouds}
					<div class="px-2">
						<ToggleButtons
							label="Mode"
							items={MODE_ITEMS}
							bind:value={getMode, selectMode}
						/>
					</div>
				{/if}

				{#if isObjectPointCloudsMode}
					{@render objectPointClouds()}
				{:else}
					{@render detections()}
				{/if}
			</Section>
		</div>
	{/snippet}
</ConnectionStatus>

{#snippet cameraRow()}
	<div class="flex">
		<CameraSelect choice={cameraChoice} />
	</div>
{/snippet}

{#snippet detections()}
	<Section.Body>
		<Image
			label={CAPTURE_ALL_METHOD}
			data={captureAllQuery.data}
			detectionsSupported={Boolean(propertiesQuery.data?.detectionsSupported)}
			classificationsSupported={Boolean(propertiesQuery.data?.classificationsSupported)}
			running={isImageStarted}
			onStart={() => {
				isImageStarted = true
			}}
			bind:startAutomatically={
				() => !waitToStartImage.current,
				(checked) => {
					waitToStartImage.current = !checked
				}
			}
			pictureInPictureKey={`${resourceName}-capture`}
			{addToDataset}
		>
			<div class="w-58 max-w-full">
				<RefetchController
					allowLive
					{refetchInterval}
					queries={[propertiesQuery, captureAllQuery]}
				/>
			</div>
			{@render cameraRow()}
		</Image>
	</Section.Body>

	{#if detectionsSlow}
		{@render slowLine()}
	{/if}
{/snippet}

{#snippet objectPointClouds()}
	<Section.Body>
		{#if !arePointCloudsStarted}
			{@render splash(
				'Object point clouds not started',
				'Start object point clouds',
				'aspect-square',
				() => {
					arePointCloudsStarted = true
				}
			)}
		{:else if getObjectPointCloudsQuery.data === undefined}
			<div class="bg-light grid aspect-square w-full place-content-center">
				<Progress
					label="Loading object point clouds"
					class="w-48"
				/>
			</div>
		{:else}
			<ObjectPointClouds objects={getObjectPointCloudsQuery.data} />
		{/if}
	</Section.Body>

	<div
		role="group"
		aria-label={OBJECT_POINT_CLOUDS_METHOD}
		class="flex flex-col gap-2 px-2"
	>
		<Field class="flex items-center gap-2">
			<Checkbox
				bind:checked={
					() => !waitToStartPointClouds.current,
					(checked) => {
						waitToStartPointClouds.current = !checked
					}
				}
			/>
			<Label>Start feed automatically</Label>
		</Field>
		<div class="w-58 max-w-full">
			<RefetchController
				refetchInterval={getObjectPointCloudsRefetchInterval}
				queries={[getObjectPointCloudsQuery]}
			/>
		</div>
		{@render cameraRow()}
	</div>

	{#if arePointCloudsStarted && objectPointCloudsSlow.isSlow}
		{@render slowLine()}
	{/if}
{/snippet}
