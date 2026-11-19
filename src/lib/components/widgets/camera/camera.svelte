<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { Canvas } from '@threlte/core'
	import { Select } from '@viamrobotics/prime-controls'
	import { Checkbox, Field, Icon, Label } from '@viamrobotics/prime-ui'
	import { CameraClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { PersistedState } from 'runed'
	import { untrack } from 'svelte'

	import type {
		MediaFrameAddToDataset,
		MediaFrameCapture,
		MediaFramePictureInPicture,
	} from '$lib/components/media-frame/media-frame-capture'

	import { useAddToDatasetAction } from '$lib/add-image-to-dataset'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import MediaFrame from '$lib/components/media-frame/media-frame.svelte'
	import Progress from '$lib/components/progress.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import {
		createRefetchIntervalStore,
		RefetchIntervals,
	} from '$lib/components/refetch-interval-store.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import { usePip } from '$lib/pip/context.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import PCDWidget from '../pcd/pcd-widget.svelte'
	import { getBlobForViamDepth, VIAM_DEPTH_MIME_TYPE } from './decode-viam-depth'
	import { getPanoCoverageFromXmp } from './get-pano-coverage-from-xmp'
	import { getSourceNames } from './get-source-names'
	import { getXmpJsonFromImageBytes, type XmpJson } from './get-xmp-json-from-image'
	import LiveOrPollingVideo from './live-or-polling-video.svelte'
	import LiveThreeSixtyCameraView from './live-three-sixty-camera-view.svelte'
	import { pickImageForSource } from './pick-image-for-source'
	import SectionErrorReporterReset from './section-error-reporter-reset.svelte'
	import SetStreamOptions from './set-stream-options.svelte'
	import ThreeSixtyCameraView from './three-sixty-camera-view.svelte'

	interface Props {
		partID: string
		resourceName: string
		/** Start the feed on mount even when "Start feed automatically" is off, e.g. the user just expanded the card. */
		autoplay?: boolean
	}

	const { partID, resourceName, autoplay = false }: Props = $props()

	// GetPointCloud returns a large payload, so it never polls faster than once a second.
	const POINT_CLOUD_MIN_INTERVAL_MS = 1000

	// The feed's ratio until its first frame reports its own size, and the 360 view's ratio always.
	const DEFAULT_ASPECT_RATIO = '16 / 9'

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'camera'
	)

	const pointCloudRefetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'camera-point-cloud'
	)

	// Each key stores `true` to wait, so its "Start feed automatically" checkbox shows the inverse.
	const waitToStartFeed = $derived(
		new PersistedState(`camera-wait-to-start-feed/${partID}/${resourceName}`, false)
	)
	const waitToStartPointCloud = $derived(
		new PersistedState(`camera-wait-to-start-point-cloud/${partID}/${resourceName}`, true)
	)

	let isPlaying = $derived(!waitToStartFeed.current)
	// Read once on purpose: mounting with autoplay is the same override as pressing
	// "Start feed", so later prop changes do not restart the feed.
	if (untrack(() => autoplay)) isPlaying = true

	let isPointCloudRunning = $derived(!waitToStartPointCloud.current)

	const getStartsFeedAutomatically = () => !waitToStartFeed.current
	const setStartsFeedAutomatically = (checked: boolean) => {
		waitToStartFeed.current = !checked
	}

	const getStartsPointCloudAutomatically = () => !waitToStartPointCloud.current
	const setStartsPointCloudAutomatically = (checked: boolean) => {
		waitToStartPointCloud.current = !checked
	}

	const startFeed = () => {
		isPlaying = true
	}

	let selectedSource = $state('')
	let sourceNames = $state<string[]>([])
	let displayAs360 = $state(false)
	let showMousePositionTooltip = $state(false)

	const sourceItems = $derived(sourceNames.map((name) => ({ value: name, label: name })))
	const getSelectedSource = () => selectedSource
	const selectSource = (next: string | undefined) => {
		if (next) selectedSource = next
	}

	const id = $props.id()
	const imagesHeadingId = `${id}-images`
	const pointCloudHeadingId = `${id}-point-cloud`
	const sourceLabelId = `${id}-source`

	const client = createResourceClient(
		CameraClient,
		() => partID,
		() => resourceName
	)

	const isLive = $derived(refetchInterval.current === RefetchIntervals.LIVE)
	const isShowingVideo = $derived(isPlaying && !displayAs360)

	const imageQuery = createResourceQuery(
		client,
		'getImages',
		() => (selectedSource ? ([[selectedSource]] as [string[]]) : ([] as [])),
		() => ({
			enabled: isPlaying && !isLive,
			refetchInterval: refetchInterval.current,
		})
	)

	// The live WebRTC stream carries no XMP, so when live we fetch a single frame
	// to learn the GPano crop geometry needed to render the stream on the right band.
	const liveCoverageProbe = createResourceQuery(
		client,
		'getImages',
		() => (selectedSource ? ([[selectedSource]] as [string[]]) : ([] as [])),
		() => ({
			enabled: isPlaying && isLive,
			refetchInterval: false,
		})
	)

	$effect(() => {
		if (sourceNames.length === 0 && imageQuery.data?.images) {
			const names = getSourceNames(imageQuery.data.images)
			if (names.length > 0) {
				sourceNames = names
				selectedSource = names[0]!
			}
		}
	})

	const xmpJson = $derived.by((): XmpJson | null => {
		const imageRecord = isLive ? liveCoverageProbe.data?.images?.[0] : imageQuery.data?.images?.[0]
		const image = imageRecord?.image
		if (!image) {
			return null
		}

		return getXmpJsonFromImageBytes(new Uint8Array(image), imageRecord.mimeType)
	})

	// Covers both the full-sphere `viam:equirectangular` tag and GPano
	// (Google Photo Sphere) cropped-area metadata. Non-null means the image
	// can be rendered on a viewing sphere.
	const panoCoverage = $derived.by(() => getPanoCoverageFromXmp(xmpJson))
	// A GPano frame is a partial band, not a full 360° sphere.
	const panoToggleLabel = $derived(
		panoCoverage?.kind === 'gpano' ? 'Display as panorama' : 'Display as 360°'
	)

	const pointCloudInterval = $derived.by(() => {
		const interval = pointCloudRefetchInterval.current
		if (typeof interval !== 'number') return interval
		return Math.max(interval, POINT_CLOUD_MIN_INTERVAL_MS)
	})

	const pointcloudQuery = createResourceQuery(client, 'getPointCloud', () => ({
		enabled: isPointCloudRunning,
		refetchInterval: pointCloudInterval,
	}))

	// A separate, disabled query for the full-resolution screenshot,
	// so it works at any refresh rate and does not affect the feed.
	const exportScreenshotQuery = createResourceQuery(
		client,
		'getImages',
		() => (selectedSource ? ([[selectedSource]] as [string[]]) : ([] as [])),
		{
			enabled: false,
			refetchInterval: false,
		}
	)

	// The frame's Screenshot, Picture-in-picture, and Add to dataset report their own failures here.
	const imagesErrors = useSectionErrors(() => ({}))

	const pointcloudErrors = useSectionErrors(() => ({ queries: [pointcloudQuery] }))

	const pip = usePip()

	// No stream of its own: pip plays the one `LiveOrPollingVideo` registers under the camera's name.
	const pictureInPicture = $derived<MediaFramePictureInPicture>({ key: resourceName })

	$effect(() => {
		if (resourceName === pip.resourceName) {
			pip.setRate(refetchInterval.current)
		}
	})

	let feedFps = $state<number>()
	let feedAspectRatio = $state(DEFAULT_ASPECT_RATIO)

	const updateFeedFrame = (frame: { fps: number; width: number; height: number }) => {
		feedFps = frame.fps
		if (frame.width > 0 && frame.height > 0) {
			feedAspectRatio = `${frame.width} / ${frame.height}`
		}
	}

	const frameAspectRatio = $derived(isShowingVideo ? feedAspectRatio : DEFAULT_ASPECT_RATIO)
	const frameFps = $derived(isShowingVideo ? feedFps : undefined)

	type GetImagesResponse = NonNullable<typeof imageQuery.data>

	const requireSelectedImage = (response: GetImagesResponse | undefined) => {
		const image = pickImageForSource(response?.images, selectedSource)
		if (!image?.image) {
			throw new Error(`GetImages returned no image for ${selectedSource || resourceName}`)
		}
		return image
	}

	const captureFullResolution = async (): Promise<MediaFrameCapture> => {
		const { data, error } = await exportScreenshotQuery.refetch()
		if (error) throw error

		const image = requireSelectedImage(data)
		const bytes = new Uint8Array(image.image)
		if (image.mimeType !== VIAM_DEPTH_MIME_TYPE) {
			return { binaryData: bytes, mimeType: image.mimeType || 'image/jpeg' }
		}

		// Depth frames save as the PNG the feed shows, since no viewer opens the raw format.
		const png = await getBlobForViamDepth(bytes)
		if (!png) throw new Error('Failed to decode depth image')
		return { binaryData: new Uint8Array(await png.arrayBuffer()), mimeType: png.type }
	}

	const latestImages = async () => {
		if (!isLive) return imageQuery.data
		// The live feed is WebRTC and holds no bytes, so Live fetches one frame.
		const { data, error } = await imageQuery.refetch()
		if (error) throw error
		return data
	}

	const captureSelectedImage = async (): Promise<MediaFrameCapture> => {
		const image = requireSelectedImage(await latestImages())
		return { binaryData: new Uint8Array(image.image), mimeType: image.mimeType }
	}

	const getAddToDatasetAction = useAddToDatasetAction(() => ({
		partID,
		cameraName: resourceName,
		methodName: 'getImages',
	}))

	const addToDataset = $derived.by((): MediaFrameAddToDataset | undefined => {
		const action = getAddToDatasetAction()
		if (!action) return undefined
		return { ...action, capture: captureSelectedImage }
	})
</script>

{#snippet checkboxField(
	label: string,
	getChecked: () => boolean,
	setChecked: (checked: boolean) => void
)}
	<Field class="flex items-center gap-2">
		<Checkbox bind:checked={getChecked, setChecked} />
		<Label>{label}</Label>
	</Field>
{/snippet}

{#snippet feedMedia()}
	{#if isShowingVideo}
		<SectionErrorReporterReset>
			<LiveOrPollingVideo
				{partID}
				{resourceName}
				videoClass="block h-auto w-full"
				{isLive}
				data={imageQuery.data}
				error={imageQuery.error}
				isLoading={imageQuery.isLoading}
				refetch={imageQuery.refetch}
				{showMousePositionTooltip}
				sourceName={selectedSource}
				onFrame={updateFeedFrame}
			/>
		</SectionErrorReporterReset>
	{:else if isPlaying && isLive}
		<div class="size-full">
			<!-- renderMode="always" keeps the live VideoTexture advancing each frame -->
			<Canvas renderMode="always">
				<LiveThreeSixtyCameraView
					{partID}
					{resourceName}
					coverage={panoCoverage}
				/>
			</Canvas>
		</div>
	{:else if isPlaying}
		<div class="size-full">
			<Canvas>
				<ThreeSixtyCameraView
					data={imageQuery.data}
					coverage={panoCoverage}
				/>
			</Canvas>
		</div>
	{/if}
{/snippet}

{#snippet pointCloudCheckbox()}
	{@render checkboxField(
		'Start feed automatically',
		getStartsPointCloudAutomatically,
		setStartsPointCloudAutomatically
	)}
{/snippet}

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="flex flex-col">
			<Section
				errorReporter={imagesErrors}
				class="flex-col px-0 py-0"
			>
				<div class="p-4 pb-3">
					<Section.Heading>
						<span id={imagesHeadingId}>
							<Section.Method
								method="GetImages"
								api={ResourceTriplets.Camera}
							/>
						</span>
						{#snippet aside()}
							<Section.Errors errors={imagesErrors.errors} />
						{/snippet}
					</Section.Heading>
				</div>

				<div
					role="group"
					aria-labelledby={imagesHeadingId}
					class="flex flex-col"
				>
					<MediaFrame
						label={resourceName}
						media={feedMedia}
						aspectRatio={frameAspectRatio}
						running={isPlaying}
						onStart={startFeed}
						bind:startAutomatically={getStartsFeedAutomatically, setStartsFeedAutomatically}
						fps={frameFps}
						screenshot={captureFullResolution}
						{pictureInPicture}
						{addToDataset}
						bind:cursorPosition={showMousePositionTooltip}
					>
						<div class="min-w-0">
							<RefetchController
								{refetchInterval}
								allowLive
								queries={[imageQuery]}
							/>
						</div>

						{#if sourceNames.length > 0 && !isLive}
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
						{/if}

						{#if panoCoverage}
							{@render checkboxField(
								panoToggleLabel,
								() => displayAs360,
								(checked) => {
									displayAs360 = checked
								}
							)}
						{/if}

						{#if isShowingVideo && isLive}
							<SetStreamOptions
								{partID}
								{resourceName}
								class="-mx-4 -mb-4"
							/>
						{/if}
					</MediaFrame>
				</div>
			</Section>

			<Section
				errorReporter={pointcloudErrors}
				class="flex-col border-t px-0 py-0"
			>
				<div class="p-4 pb-3">
					<Section.Heading>
						<span id={pointCloudHeadingId}>
							<Section.Method
								method="GetPointCloud"
								api={ResourceTriplets.Camera}
							/>
						</span>
						{#snippet aside()}
							<Section.Errors errors={pointcloudErrors.errors} />
							<Section.Tooltip>
								Get depth measurement data from cameras with depth sensing support
							</Section.Tooltip>
						{/snippet}
					</Section.Heading>
				</div>

				<div
					role="group"
					aria-labelledby={pointCloudHeadingId}
					class="flex flex-col"
				>
					{#if isPointCloudRunning && pointcloudQuery.data !== undefined}
						<PCDWidget
							data={pointcloudQuery.data}
							label={resourceName}
						>
							{@render pointCloudCheckbox()}
						</PCDWidget>
					{:else}
						<div class="bg-medium relative flex aspect-square w-full items-center justify-center">
							{#if !isPointCloudRunning}
								<button
									type="button"
									class="button button-dark"
									onclick={() => {
										isPointCloudRunning = true
									}}
								>
									<Icon
										icon={mdiPlayCircleOutline}
										size="sm"
									/>
									Start point cloud
								</button>
							{:else if pointcloudErrors.isLoading}
								<div class="absolute inset-0">
									<Progress />
								</div>
							{/if}
						</div>
						<div class="px-4 pt-3">
							{@render pointCloudCheckbox()}
						</div>
					{/if}

					<div class="p-4">
						<RefetchController
							refetchInterval={pointCloudRefetchInterval}
							queries={[pointcloudQuery]}
						/>
					</div>
				</div>
			</Section>
		</div>
	{/snippet}
</ConnectionStatus>
