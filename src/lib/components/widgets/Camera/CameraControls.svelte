<script lang="ts">
	import type {
		MediaFrameAddToDataset,
		MediaFrameCapture,
		MediaFramePictureInPicture,
	} from '#lib/components/MediaFrame/media-frame-capture.js'

	import { Canvas } from '@threlte/core'
	import { Select, ToggleButtons } from '@viamrobotics/prime-controls'
	import { Checkbox, Field, Label } from '@viamrobotics/prime-ui'
	import { CameraClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { useAddToDatasetAction } from '#lib/add-image-to-dataset.js'
	import ConnectionStatus from '#lib/components/ConnectionStatus.svelte'
	import { CANVAS_FITS, MEDIA_FITS, type MediaFit } from '#lib/components/MediaFrame/media-fit.js'
	import { createMediaFit } from '#lib/components/MediaFrame/media-fit.svelte.js'
	import MediaFrame from '#lib/components/MediaFrame/MediaFrame.svelte'
	import Progress from '#lib/components/Progress.svelte'
	import {
		createRefetchIntervalStore,
		RefetchIntervals,
	} from '#lib/components/refetch-interval-store.svelte.js'
	import RefetchController from '#lib/components/RefetchController.svelte'
	import { Section, useSectionErrors } from '#lib/components/Section/index.js'
	import { usePip } from '#lib/pip/context.svelte.js'
	import { PersistedState } from 'runed'
	import { untrack } from 'svelte'

	import PCDWidget from '../PCD/PCDWidget.svelte'
	import { captureVideoFrame } from './capture-video-frame'
	import { getBlobForViamDepth, VIAM_DEPTH_MIME_TYPE } from './decode-viam-depth'
	import { depthPreviewFor } from './depth-preview'
	import { getPanoCoverageFromXmp } from './get-pano-coverage-from-xmp'
	import { getSourceNames } from './get-source-names'
	import { getXmpJsonFromImageBytes, type XmpJson } from './get-xmp-json-from-image'
	import LiveOrPollingVideo from './LiveOrPollingVideo.svelte'
	import LiveThreeSixtyCameraView from './LiveThreeSixtyCameraView.svelte'
	import { pickImageForSource } from './pick-image-for-source'
	import SectionErrorReporterReset from './SectionErrorReporterReset.svelte'
	import StreamResolutionRow from './StreamResolutionRow.svelte'
	import ThreeSixtyCameraView from './ThreeSixtyCameraView.svelte'

	interface Props {
		partID: string
		resourceName: string
		/** Start the feed on mount even when "Start feed automatically" is off, e.g. the user just expanded the card. */
		autoplay?: boolean
		/**
		 * The camera's configured frame width, such as webcam `width_px`. With `heightPx`, it sets the
		 * feed's ratio until the first frame reports its own size. Ignored unless above 0.
		 */
		widthPx?: number
		/** The camera's configured frame height, such as webcam `height_px`. See `widthPx`. */
		heightPx?: number
		/** Seeds Image mode's Fit until the person picks one. A value that is not a fit is ignored. */
		defaultFit?: MediaFit
	}

	const { partID, resourceName, autoplay = false, widthPx, heightPx, defaultFit }: Props = $props()

	// GetPointCloud returns a large payload, so it never polls faster than once a second.
	const POINT_CLOUD_MIN_INTERVAL_MS = 1000

	// The feed's ratio until its first frame reports its own size, when `widthPx` and `heightPx` give none, and the 360 view's ratio always.
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

	// A dropped Live stream, held for the indicator until the next Start feed.
	let liveStreamError = $state<Error>()

	const startFeed = () => {
		liveStreamError = undefined
		isPlaying = true
	}

	const startPointCloud = () => {
		isPointCloudRunning = true
	}

	const IMAGE_MODE = 'image'
	const POINT_CLOUD_MODE = 'point-cloud'
	const IMAGE_MODE_LABEL = 'Image'
	const POINT_CLOUD_MODE_LABEL = 'Point cloud'
	const MODE_ITEMS = [
		{ value: IMAGE_MODE, label: IMAGE_MODE_LABEL },
		{ value: POINT_CLOUD_MODE, label: POINT_CLOUD_MODE_LABEL },
	]

	let mode = $state(IMAGE_MODE)
	const getMode = () => mode
	// A single-choice toggle reports an empty value when its pressed option is pressed again, which keeps the mode.
	const selectMode = (next: string | undefined) => {
		if (next) mode = next
	}

	let pickedSource = $state<string>()
	let displayAs360 = $state(false)
	let showMousePositionTooltip = $state(false)

	const id = $props.id()
	const sourceLabelId = `${id}-source`

	const client = createResourceClient(
		CameraClient,
		() => partID,
		() => resourceName
	)

	// Read once on mount: the Mode toggle shows only for a camera that reports point cloud support.
	const propertiesQuery = createResourceQuery(client, 'getProperties', () => ({
		refetchInterval: false,
	}))

	const supportsPointCloud = $derived(propertiesQuery.data?.supportsPcd === true)
	const isPointCloudMode = $derived(supportsPointCloud && mode === POINT_CLOUD_MODE)

	const modeLabel = $derived(isPointCloudMode ? POINT_CLOUD_MODE_LABEL : IMAGE_MODE_LABEL)

	const imageFit = createMediaFit(() => `camera-media-fit/${partID}/${resourceName}`, {
		fits: MEDIA_FITS,
		get defaultFit() {
			return defaultFit
		},
	})
	const pointCloudFit = createMediaFit(() => `camera-point-cloud-fit/${partID}/${resourceName}`, {
		fits: CANVAS_FITS,
	})
	const activeFit = $derived(isPointCloudMode ? pointCloudFit : imageFit)
	// Every fit but Keep ratio fills the height the host gives the control, so the section passes that height down.
	const isFillingHeight = $derived(activeFit.current !== 'keep-ratio')

	const isLive = $derived(refetchInterval.current === RefetchIntervals.LIVE)
	const isFeedActive = $derived(isPlaying && !isPointCloudMode)
	const isShowingVideo = $derived(isPlaying && !displayAs360)

	interface SourceListing {
		data?: { images: { sourceName: string }[] }
	}

	// The feed's query filters by the selected source, which defaults from the query's own first response.
	// The query reaches the source list through this reference, since the query is built after the list.
	let feedListing = $state.raw<SourceListing>()

	// The first response lists every source. Once one is selected, responses hold only it, so the list is kept.
	let knownSourceNames: string[] = []
	const sourceNames = $derived.by(() => {
		if (knownSourceNames.length === 0) {
			knownSourceNames = getSourceNames(feedListing?.data?.images ?? [])
		}
		return knownSourceNames
	})
	const selectedSource = $derived(pickedSource ?? sourceNames[0] ?? '')
	const sourceItems = $derived(sourceNames.map((name) => ({ value: name, label: name })))
	const getSelectedSource = () => selectedSource
	const selectSource = (next: string | undefined) => {
		if (next) pickedSource = next
	}

	const imageQuery = createResourceQuery(
		client,
		'getImages',
		() => (selectedSource ? ([[selectedSource]] as [string[]]) : ([] as [])),
		() => ({
			enabled: isFeedActive && !isLive,
			refetchInterval: refetchInterval.current,
		})
	)
	feedListing = imageQuery

	// The live WebRTC stream carries no XMP, so when live we fetch a single frame
	// to learn the GPano crop geometry needed to render the stream on the right band.
	const liveCoverageProbe = createResourceQuery(
		client,
		'getImages',
		() => (selectedSource ? ([[selectedSource]] as [string[]]) : ([] as [])),
		() => ({
			enabled: isFeedActive && isLive,
			refetchInterval: false,
		})
	)

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
		enabled: isPointCloudRunning && isPointCloudMode,
		refetchInterval: pointCloudInterval,
	}))

	// A separate, disabled query for the one capture that cannot copy what is on screen: the live 360 view.
	const exportScreenshotQuery = createResourceQuery(
		client,
		'getImages',
		() => (selectedSource ? ([[selectedSource]] as [string[]]) : ([] as [])),
		{
			enabled: false,
			refetchInterval: false,
		}
	)

	const modeQueries = $derived(
		isPointCloudMode ? [propertiesQuery, pointcloudQuery] : [propertiesQuery]
	)

	// The frame's Screenshot, Picture-in-picture, and Add to dataset report their own failures here.
	// The feed reports a failed poll through `onPollingError`, so GetImages is not one of the queries.
	const sectionErrors = useSectionErrors(() => ({ queries: modeQueries }))

	let feedPollingError = $state<Error>()
	const reportFeedPollingError = (error: Error | undefined) => {
		feedPollingError = error
	}

	// A dropped Live stream returns the splash, so a retry is one press of Start feed.
	const stopFeedOnStreamError = (error: Error) => {
		liveStreamError = error
		isPlaying = false
	}

	$effect(() =>
		// Registering writes the section's error set, so it must not subscribe this effect to it.
		untrack(() => {
			const removePollingError = sectionErrors.report(() => feedPollingError ?? null)
			const removeStreamError = sectionErrors.report(() => liveStreamError ?? null)
			return () => {
				removePollingError()
				removeStreamError()
			}
		})
	)

	const pip = usePip()

	// No stream of its own: pip plays the one `LiveOrPollingVideo` registers under the camera's name.
	const pictureInPicture = $derived<MediaFramePictureInPicture>({ key: resourceName })

	$effect(() => {
		if (resourceName === pip.resourceName) {
			pip.setRate(refetchInterval.current)
		}
	})

	const isFrameSize = (value: number | undefined): value is number =>
		typeof value === 'number' && Number.isFinite(value) && value > 0

	const configuredAspectRatio = $derived.by(() => {
		if (!isFrameSize(widthPx) || !isFrameSize(heightPx)) return DEFAULT_ASPECT_RATIO
		return `${widthPx} / ${heightPx}`
	})

	let feedFps = $state<number>()
	let reportedAspectRatio = $state<string>()
	const feedAspectRatio = $derived(reportedAspectRatio ?? configuredAspectRatio)

	const updateFeedFrame = (frame: { fps: number; width: number; height: number }) => {
		feedFps = frame.fps
		if (frame.width > 0 && frame.height > 0) {
			reportedAspectRatio = `${frame.width} / ${frame.height}`
		}
	}

	const frameAspectRatio = $derived(displayAs360 ? DEFAULT_ASPECT_RATIO : feedAspectRatio)
	const frameFps = $derived(isShowingVideo ? feedFps : undefined)

	type GetImagesResponse = NonNullable<typeof imageQuery.data>

	const requireSelectedImage = (response: GetImagesResponse | undefined) => {
		const image = pickImageForSource(response?.images, selectedSource)
		if (!image?.image) {
			throw new Error(`GetImages returned no image for ${selectedSource || resourceName}`)
		}
		return image
	}

	let modeGroup = $state<HTMLElement>()

	// A capture is the frame on screen when the button is pressed, never one fetched for the press.
	// Polling holds that frame's bytes. Live is WebRTC and holds none, so its frame is copied from the video.
	const shownImage = () => requireSelectedImage(imageQuery.data)
	const shownVideoFrame = async () => {
		const video = modeGroup?.querySelector('video')
		if (!video) throw new Error('The live feed has no video to capture')
		return captureVideoFrame(video)
	}

	// The live 360 view draws its video into a WebGL texture, which cannot be copied, so it alone fetches a frame.
	const fetchedImage = async () => {
		const { data, error } = await exportScreenshotQuery.refetch()
		if (error) throw error
		return requireSelectedImage(data)
	}

	const captureScreenshot = async (): Promise<MediaFrameCapture> => {
		if (isLive && !displayAs360) return shownVideoFrame()

		const image = isLive ? await fetchedImage() : shownImage()
		const bytes = new Uint8Array(image.image)
		if (image.mimeType !== VIAM_DEPTH_MIME_TYPE) {
			return { binaryData: bytes, mimeType: image.mimeType || 'image/jpeg' }
		}

		// Depth frames save as the PNG the feed shows, since no viewer opens the raw format.
		const png = await getBlobForViamDepth(bytes)
		if (!png) throw new Error('Failed to decode depth image')
		return { binaryData: new Uint8Array(await png.arrayBuffer()), mimeType: png.type }
	}

	const captureForDataset = async (): Promise<MediaFrameCapture> => {
		if (isLive && !displayAs360) return shownVideoFrame()

		const image = isLive ? await fetchedImage() : shownImage()
		const binaryData = new Uint8Array(image.image)
		return {
			binaryData,
			mimeType: image.mimeType,
			preview: await depthPreviewFor(binaryData, image.mimeType),
		}
	}

	const getAddToDatasetAction = useAddToDatasetAction(() => ({
		partID,
		cameraName: resourceName,
		methodName: 'getImages',
	}))

	const addToDataset = $derived.by((): MediaFrameAddToDataset | undefined => {
		const action = getAddToDatasetAction()
		if (!action) return undefined
		return { ...action, capture: captureForDataset }
	})

	const getPointCloudDatasetAction = useAddToDatasetAction(() => ({
		partID,
		cameraName: resourceName,
		methodName: 'getPointCloud',
	}))
</script>

{#snippet checkboxField(
	label: string,
	getChecked: () => boolean,
	setChecked: (checked: boolean) => void
)}
	<Field
		{label}
		class="flex items-center gap-2"
	>
		<Checkbox bind:checked={getChecked, setChecked} />
		<Label />
	</Field>
{/snippet}

{#snippet feedMedia()}
	{#if isShowingVideo}
		<SectionErrorReporterReset>
			<LiveOrPollingVideo
				{partID}
				{resourceName}
				fit={imageFit.current}
				{isLive}
				data={imageQuery.data}
				error={imageQuery.error}
				isLoading={imageQuery.isLoading}
				refetch={imageQuery.refetch}
				{showMousePositionTooltip}
				sourceName={selectedSource}
				onFrame={updateFeedFrame}
				onPollingError={reportFeedPollingError}
				onStreamError={stopFeedOnStreamError}
			/>
		</SectionErrorReporterReset>
	{:else if isPlaying && isLive}
		<div
			class="size-full"
			role="img"
			aria-label="{resourceName} 360 view"
		>
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
		<div
			class="size-full"
			role="img"
			aria-label="{resourceName} 360 view"
		>
			<Canvas>
				<ThreeSixtyCameraView
					data={imageQuery.data}
					coverage={panoCoverage}
				/>
			</Canvas>
		</div>
	{/if}
{/snippet}

{#snippet pointCloudLoading()}
	<div class="bg-medium absolute inset-0">
		{#if sectionErrors.isLoading}
			<Progress />
		{/if}
	</div>
{/snippet}

{#snippet pointCloudRefreshRow()}
	<div class="min-w-0">
		<RefetchController
			refetchInterval={pointCloudRefetchInterval}
			queries={[pointcloudQuery]}
		/>
	</div>
{/snippet}

{#snippet feedFrame()}
	<MediaFrame
		label={resourceName}
		media={feedMedia}
		aspectRatio={frameAspectRatio}
		running={isPlaying}
		onStart={startFeed}
		bind:startAutomatically={getStartsFeedAutomatically, setStartsFeedAutomatically}
		fps={frameFps}
		screenshot={captureScreenshot}
		{pictureInPicture}
		{addToDataset}
		bind:cursorPosition={showMousePositionTooltip}
		fit={imageFit}
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
			<StreamResolutionRow
				{partID}
				{resourceName}
			/>
		{/if}
	</MediaFrame>
{/snippet}

{#snippet pointCloudFrame()}
	<!-- One frame from splash to cloud, so focus on Start point cloud is not dropped when the cloud lands. -->
	<PCDWidget
		data={pointcloudQuery.data}
		label={resourceName}
		fit={pointCloudFit}
		addToDataset={getPointCloudDatasetAction()}
		running={isPointCloudRunning}
		onStart={startPointCloud}
		startLabel="Start point cloud"
		placeholder={pointCloudLoading}
		bind:startAutomatically={getStartsPointCloudAutomatically, setStartsPointCloudAutomatically}
	>
		{@render pointCloudRefreshRow()}
	</PCDWidget>
{/snippet}

<ConnectionStatus {partID}>
	{#snippet connected()}
		<Section
			errorReporter={sectionErrors}
			class={['flex-col px-0 py-0', isFillingHeight && 'h-full min-h-0']}
		>
			<div class="p-4 pb-3">
				<Section.Heading class="justify-between">
					Live feed
					{#snippet aside()}
						<Section.Errors errors={sectionErrors.errors} />
						{#if isPointCloudMode}
							<Section.Tooltip>
								Get depth measurement data from cameras with depth sensing support
							</Section.Tooltip>
						{/if}
					{/snippet}
				</Section.Heading>
			</div>

			{#if supportsPointCloud}
				<div class="px-4 pb-3">
					<ToggleButtons
						label="Mode"
						items={MODE_ITEMS}
						bind:value={getMode, selectMode}
					/>
				</div>
			{/if}

			<div
				bind:this={modeGroup}
				role="group"
				aria-label={modeLabel}
				class={['flex flex-col', isFillingHeight && 'min-h-0 flex-1']}
			>
				{#if isPointCloudMode}
					{@render pointCloudFrame()}
				{:else}
					{@render feedFrame()}
				{/if}
			</div>
		</Section>
	{/snippet}
</ConnectionStatus>
