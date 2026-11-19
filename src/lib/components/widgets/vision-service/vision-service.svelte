<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { Select } from '@viamrobotics/prime-controls'
	import { Checkbox, Field, Icon, Label, Progress } from '@viamrobotics/prime-ui'
	import { VisionClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceQuery,
		useResourceStatuses,
	} from '@viamrobotics/svelte-sdk'
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

	// Resource names cannot contain a space, so the item's value never collides with a camera's name.
	const DEFAULT_CAMERA = 'Default camera'

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

	let initialFetchComplete = $state(false)
	let cameraName = $state('')

	const cameraStatuses = useResourceStatuses(() => partID, 'camera')

	const cameras = $derived(
		cameraStatuses.current
			.map((status) => status.name?.name)
			.filter((name): name is string => name !== undefined)
	)

	const cameraItems = $derived([
		{ value: DEFAULT_CAMERA, label: DEFAULT_CAMERA },
		...cameras.map((name) => ({ value: name, label: name })),
	])

	const getCameraValue = () => (cameraName === '' ? DEFAULT_CAMERA : cameraName)
	const selectCamera = (next: string | undefined) => {
		if (next === undefined) return
		cameraName = next === DEFAULT_CAMERA ? '' : next
	}

	$effect.pre(() => {
		if (cameras.length > 0 && !initialFetchComplete) {
			initialFetchComplete = true
			cameraName = cameras[0] ?? ''
		}
	})

	const boundedInterval = (interval: RefetchInterval, minimumMs: number): number | false =>
		interval === false ? false : Math.max(interval, minimumMs)

	const client = createResourceClient(
		VisionClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties', () => ({
		refetchInterval: boundedInterval(refetchInterval.current, PROPERTIES_MIN_INTERVAL_MS),
	}))

	const captureAllQuery = createResourceQuery(
		client,
		'captureAllFromCamera',
		(): Parameters<VisionClient['captureAllFromCamera']> => [
			cameraName,
			{
				returnImage: true,
				returnClassifications: Boolean(propertiesQuery.data?.classificationsSupported),
				returnDetections: Boolean(propertiesQuery.data?.detectionsSupported),
				returnObjectPointClouds: false,
			},
		],
		() => ({
			enabled: isImageStarted,
			refetchInterval: boundedInterval(refetchInterval.current, CAPTURE_MIN_INTERVAL_MS),
		})
	)

	const getObjectPointCloudsQuery = createResourceQuery(
		client,
		'getObjectPointClouds',
		(): Parameters<VisionClient['getObjectPointClouds']> => [cameraName],
		() => ({
			enabled: arePointCloudsStarted,
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

	const captureErrors = useSectionErrors(() => ({ queries: [propertiesQuery, captureAllQuery] }))
	const objectPointCloudsErrors = useSectionErrors(() => ({
		queries: [getObjectPointCloudsQuery],
	}))

	// Only a report of unsupported hides the section, so it shows while GetProperties is unanswered.
	const showsObjectPointClouds = $derived(
		propertiesQuery.data?.objectPointCloudsSupported !== false
	)

	// `Default camera` sends an empty name, and the service resolves it to its own default camera.
	const capturedCameraName = $derived(cameraName || (propertiesQuery.data?.defaultCamera ?? ''))

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

	const cameraLabelId = $props.id()
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
		<div class="mx-auto flex w-full max-w-224 min-w-0 flex-col">
			<div class="flex flex-wrap items-center gap-2 p-2">
				<div class="flex max-w-60 min-w-40 flex-1 items-center gap-2">
					<span
						id={cameraLabelId}
						class="text-subtle-1 shrink-0 text-xs"
					>
						Camera
					</span>
					<div class="min-w-0 flex-1">
						<Select
							items={cameraItems}
							bind:value={getCameraValue, selectCamera}
							aria-labelledby={cameraLabelId}
						/>
					</div>
				</div>
			</div>

			<Section
				errorReporter={captureErrors}
				class="min-w-0 flex-col gap-2 border-t px-0 py-2"
			>
				<Section.Heading class="px-2">
					<Section.Method
						method={CAPTURE_ALL_METHOD}
						api={ResourceTriplets.Vision}
					/>
					{#snippet aside()}
						<Section.Errors errors={captureErrors.errors} />
					{/snippet}
				</Section.Heading>

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
					</Image>
				</Section.Body>

				{#if detectionsSlow}
					{@render slowLine()}
				{/if}
			</Section>

			{#if showsObjectPointClouds}
				<Section
					errorReporter={objectPointCloudsErrors}
					class="min-w-0 flex-col gap-2 border-t px-0 py-2"
				>
					<Section.Heading class="px-2">
						<Section.Method
							method={OBJECT_POINT_CLOUDS_METHOD}
							api={ResourceTriplets.Vision}
						/>
						{#snippet aside()}
							<Section.Errors errors={objectPointCloudsErrors.errors} />
						{/snippet}
					</Section.Heading>

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
					</div>

					{#if arePointCloudsStarted && objectPointCloudsSlow.isSlow}
						{@render slowLine()}
					{/if}
				</Section>
			{/if}
		</div>
	{/snippet}
</ConnectionStatus>
