<script lang="ts">
	import type { MediaFrameCapture } from '#lib/components/MediaFrame/media-frame-capture.js'

	import { ToggleButtons } from '@viamrobotics/prime-controls'
	import { Checkbox, Field, Label, Progress } from '@viamrobotics/prime-ui'
	import { CameraClient, type PointCloudObject, VisionClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { useAddToDatasetAction } from '#lib/add-image-to-dataset.js'
	import ConnectionStatus from '#lib/components/ConnectionStatus.svelte'
	import {
		createRefetchIntervalStore,
		type RefetchInterval,
		RefetchIntervals,
	} from '#lib/components/refetch-interval-store.svelte.js'
	import RefetchController from '#lib/components/RefetchController.svelte'
	import { Section, useSectionErrors } from '#lib/components/Section/index.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { PersistedState } from 'runed'
	import { tick, untrack } from 'svelte'

	import { createCameraChoice } from './camera-choice.svelte'
	import CameraSelect from './CameraSelect.svelte'
	import { describeConfidenceLine } from './confidence-line'
	import Image from './Image.svelte'
	import ObjectPointClouds from './ObjectPointClouds.svelte'
	import { useSlowRequest } from './use-slow-request.svelte.ts'

	interface Props {
		partID: string
		resourceName: string
		/** The mlmodel service's `default_minimum_confidence`. Only 0 to 1 shows. The service applies it. */
		minimumConfidence?: number
		/** The mlmodel service's `label_confidences`. Only values from 0 to 1 show. The service applies them. */
		labelConfidences?: Record<string, number>
	}

	const { partID, resourceName, minimumConfidence, labelConfidences }: Props = $props()

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

	const cameraChoice = createCameraChoice(
		() => partID,
		() => propertiesQuery.data?.defaultCamera
	)

	const confidenceLine = $derived(describeConfidenceLine(minimumConfidence, labelConfidences))

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
			refetchInterval: false,
		})
	)

	let showsCameraPointCloud = $state(true)

	// The camera whose frame the objects are in. `Default camera` sends an empty name, which only GetProperties can resolve.
	const objectsCameraName = $derived(
		cameraChoice.cameraName || (propertiesQuery.data?.defaultCamera ?? '')
	)

	const cameraClient = createResourceClient(
		CameraClient,
		() => partID,
		() => objectsCameraName
	)

	// The camera's whole cloud, drawn behind the objects.
	const cameraPointCloudQuery = createResourceQuery(cameraClient, 'getPointCloud', () => ({
		enabled:
			arePointCloudsStarted &&
			isObjectPointCloudsMode &&
			showsCameraPointCloud &&
			objectsCameraName !== '',
		refetchInterval: false,
	}))

	const drawsCameraPointCloud = $derived(showsCameraPointCloud && objectsCameraName !== '')

	interface ObjectsScene {
		objects: PointCloudObject[]
		backdrop: Uint8Array | undefined
	}

	// The objects and the cloud they are drawn on, from one round of reads.
	let objectsScene = $state.raw<ObjectsScene>()

	// Latches a pair only once both reads of a round have settled, so objects are not drawn on another round's cloud.
	$effect(() => {
		const objects = getObjectPointCloudsQuery.data
		// A new camera has no response yet, and the last camera's objects are not its own.
		if (objects === undefined) {
			objectsScene = undefined
			return
		}
		if (getObjectPointCloudsQuery.isFetching) return
		if (!drawsCameraPointCloud) {
			objectsScene = { objects, backdrop: undefined }
			return
		}
		if (cameraPointCloudQuery.isFetching) return
		objectsScene = { objects, backdrop: cameraPointCloudQuery.data }
	})

	const captureAllSlow = useSlowRequest(() => captureAllQuery.isFetching)
	const propertiesSlow = useSlowRequest(() => propertiesQuery.isFetching)
	const objectPointCloudsSlow = useSlowRequest(() => getObjectPointCloudsQuery.isFetching)

	const detectionsSlow = $derived(captureAllSlow.isSlow || propertiesSlow.isSlow)

	const objectPointCloudsQueries = $derived(
		drawsCameraPointCloud
			? [getObjectPointCloudsQuery, cameraPointCloudQuery]
			: [getObjectPointCloudsQuery]
	)

	const readObjectsRound = () =>
		Promise.all(untrack(() => objectPointCloudsQueries).map(async (query) => query.refetch()))

	// Neither read polls on its own timer, since two timers drift apart. This one starts both reads of a round together.
	$effect(() => {
		const interval = boundedInterval(
			getObjectPointCloudsRefetchInterval.current,
			CAPTURE_MIN_INTERVAL_MS
		)
		if (interval === false || !arePointCloudsStarted || !isObjectPointCloudsMode) return
		let timeout: ReturnType<typeof setTimeout> | undefined
		let isStopped = false

		const readThenWait = async () => {
			await readObjectsRound()
			if (!isStopped) timeout = setTimeout(readThenWait, interval)
		}
		timeout = setTimeout(readThenWait, interval)

		return () => {
			isStopped = true
			clearTimeout(timeout)
		}
	})

	// Turning the camera cloud on reads the objects again too, so the pair comes from one round.
	const setShowsCameraPointCloud = (next: boolean) => {
		showsCameraPointCloud = next
		if (next && arePointCloudsStarted) void tick().then(readObjectsRound)
	}

	const modeQueries = $derived(
		isObjectPointCloudsMode
			? [propertiesQuery, ...objectPointCloudsQueries]
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

	{#if confidenceLine}
		<p class="text-subtle-2 px-2 text-xs">{confidenceLine}</p>
	{/if}

	{#if detectionsSlow}
		{@render slowLine()}
	{/if}
{/snippet}

{#snippet objectPointCloudsLoading()}
	<div class="bg-light grid size-full place-content-center">
		<Progress
			label="Loading object point clouds"
			class="w-48"
		/>
	</div>
{/snippet}

{#snippet objectPointClouds()}
	<Section.Body>
		<ObjectPointClouds
			label={OBJECT_POINT_CLOUDS_METHOD}
			objects={objectsScene?.objects}
			backdrop={objectsScene?.backdrop}
			running={arePointCloudsStarted}
			onStart={() => {
				arePointCloudsStarted = true
			}}
			startLabel="Start object point clouds"
			placeholder={objectPointCloudsLoading}
			bind:startAutomatically={
				() => !waitToStartPointClouds.current,
				(checked) => {
					waitToStartPointClouds.current = !checked
				}
			}
		>
			<Field
				label="Show camera point cloud"
				class="flex items-center gap-2"
			>
				<Checkbox bind:checked={() => showsCameraPointCloud, setShowsCameraPointCloud} />
				<Label />
			</Field>
			<div class="w-58 max-w-full">
				<RefetchController
					refetchInterval={getObjectPointCloudsRefetchInterval}
					queries={objectPointCloudsQueries}
				/>
			</div>
			{@render cameraRow()}
		</ObjectPointClouds>
	</Section.Body>

	{#if arePointCloudsStarted && objectPointCloudsSlow.isSlow}
		{@render slowLine()}
	{/if}
{/snippet}
