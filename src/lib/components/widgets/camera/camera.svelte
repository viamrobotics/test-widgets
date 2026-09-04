<script lang="ts">
	import { Canvas } from '@threlte/core'
	import { Button, Label, Select, Switch, ToggleButtons } from '@viamrobotics/prime-core'
	import { CameraClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { PersistedState } from 'runed'

	import { useAddImageToDataset } from '$lib/add-image-to-dataset'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import Query from '$lib/components/query.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import {
		createRefetchIntervalStore,
		RefetchIntervals,
	} from '$lib/components/refetch-interval-store.svelte'
	import SectionTitle from '$lib/components/section-title.svelte'

	import PCDWidget from '../pcd/pcd-widget.svelte'
	import ExportScreenshot from './export-screenshot.svelte'
	import { getPanoCoverageFromXmp } from './get-pano-coverage-from-xmp'
	import { getSourceNames } from './get-source-names'
	import { getXmpJsonFromImageBytes, type XmpJson } from './get-xmp-json-from-image'
	import LiveOrPollingVideo from './live-or-polling-video.svelte'
	import LiveThreeSixtyCameraView from './live-three-sixty-camera-view.svelte'
	import { pickImageForSource } from './pick-image-for-source'
	import PictureInPictureButton from './picture-in-picture-button.svelte'
	import ThreeSixtyCameraView from './three-sixty-camera-view.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'camera'
	)

	const waitToStartFeed = $derived(
		new PersistedState(`camera-wait-to-start-feed/${partID}/${resourceName}`, false)
	)

	let isPlaying = $derived(!waitToStartFeed.current)
	let isShowingPointcloud = $state(false)
	let selectedSource = $state('')
	let sourceNames = $state<string[]>([])
	let displayAs360 = $state(false)

	const { addImageToDataset } = useAddImageToDataset()
	const setIsShowingPointcloud = (event: CustomEvent<boolean>) => {
		isShowingPointcloud = event.detail
	}

	const client = createResourceClient(
		CameraClient,
		() => partID,
		() => resourceName
	)

	const isLive = $derived(refetchInterval.current === RefetchIntervals.LIVE)

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

	const pointcloudQuery = createResourceQuery(client, 'getPointCloud', () => ({
		enabled: isShowingPointcloud,
		refetchInterval:
			// Cap PCD refresh rate at once per second
			typeof refetchInterval.current === 'number'
				? Math.max(refetchInterval.current, 1000)
				: refetchInterval.current,
	}))

	// A separate, disabled query for exporting a screenshot
	// since this button should work regardless of refetch
	// interval and not affect the image feed.
	const exportScreenshotQuery = createResourceQuery(
		client,
		'getImages',
		() => (selectedSource ? ([[selectedSource]] as [string[]]) : ([] as [])),
		{
			enabled: false,
			refetchInterval: false,
		}
	)

	// Firefox has native support for picture-in-picture and does not need
	// to be requested separately. Don't show a "toggle pip" button in Firefox.
	const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')

	const onSourceSelect = (event: Event) => {
		const { value } = event.target as HTMLSelectElement
		selectedSource = value
	}

	let mousePostionTooltip = $state<'On' | 'Off'>('Off')
	const setMousePostionTooltip = (event: CustomEvent<string>) => {
		mousePostionTooltip = event.detail as 'On' | 'Off'
	}

	const headingID = $props.id()
	const getImagesHeadingID = `${headingID}-images`
	const getPointCloudHeadingID = `${headingID}-point-cloud`
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<section
			class="flex flex-col"
			aria-labelledby={getImagesHeadingID}
		>
			<div class="flex flex-col gap-0.5 p-4 pb-0">
				<SectionTitle
					title="GetImages"
					api="rdk:component:camera"
					headingId={getImagesHeadingID}
				/>
			</div>
			<div class="p-4">
				{#if isPlaying}
					{#if displayAs360}
						<div class="h-80 w-full">
							{#if isLive}
								<!-- renderMode="always" keeps the live VideoTexture advancing each frame -->
								<Canvas renderMode="always">
									<LiveThreeSixtyCameraView
										{partID}
										{resourceName}
										coverage={panoCoverage}
									/>
								</Canvas>
							{:else}
								<Canvas>
									<ThreeSixtyCameraView
										data={imageQuery.data}
										coverage={panoCoverage}
									/>
								</Canvas>
							{/if}
						</div>
					{:else}
						<LiveOrPollingVideo
							{partID}
							{resourceName}
							showResolutionOptions
							videoClass="h-auto max-w-full"
							{isLive}
							data={imageQuery.data}
							error={imageQuery.error}
							isLoading={imageQuery.isLoading}
							refetch={imageQuery.refetch}
							showMousePositionTooltip={mousePostionTooltip === 'On'}
							sourceName={selectedSource}
						/>
					{/if}
				{:else}
					<div class="bg-medium flex h-64 w-full items-center justify-center">
						<Button
							icon="play-circle-outline"
							variant="dark"
							onclick={() => {
								isPlaying = true
							}}
						>
							Start feed
						</Button>
					</div>
				{/if}

				<div class="mt-3 flex flex-wrap items-start gap-2">
					<RefetchController
						{refetchInterval}
						allowLive
						queries={[imageQuery, pointcloudQuery]}
					/>
					<ExportScreenshot
						name={client.current?.name ?? ''}
						sourceName={selectedSource}
						getImage={exportScreenshotQuery.refetch}
					/>
					{#if addImageToDataset}
						<Button
							icon="layers-triple-outline"
							onclick={async () => {
								let imgData
								if (refetchInterval.current === RefetchIntervals.LIVE) {
									const { isSuccess, data } = await imageQuery.refetch()
									if (!isSuccess) return
									imgData = data
								} else {
									imgData = imageQuery.data
								}

								const matchingImage = pickImageForSource(imgData?.images, selectedSource)
								const image = matchingImage?.image
								const mimeType = matchingImage?.mimeType

								if (image) {
									addImageToDataset({
										binaryData: new Uint8Array(image),
										partID,
										componentType: 'camera',
										componentName: resourceName,
										methodName: 'captureAllFromCamera',
										mimeType: mimeType ?? 'image/png',
										dataRequestTimes: [new Date(), new Date()],
									})
								}
							}}
						>
							Add to dataset
						</Button>
					{/if}
					{#if !isFirefox}
						<PictureInPictureButton
							{resourceName}
							rate={refetchInterval.current}
						/>
					{/if}
				</div>
				<div class="flex flex-col gap-4">
					<div class="flex w-full max-w-80 items-start gap-4">
						{#if sourceNames.length > 0 && refetchInterval.current !== RefetchIntervals.LIVE}
							<Label>
								Source
								<Select
									value={selectedSource}
									on:change={onSourceSelect}
									slot="input"
								>
									{#each sourceNames as name (name)}
										<option value={name}>{name}</option>
									{/each}
								</Select>
							</Label>
						{/if}
						{#if panoCoverage}
							<Label>
								{panoToggleLabel}
								<ToggleButtons
									slot="input"
									options={['On', 'Off']}
									selected={displayAs360 ? 'On' : 'Off'}
									on:input={(event) => {
										displayAs360 = event.detail === 'On'
									}}
								/>
							</Label>
						{/if}
					</div>
					<div class="flex w-full max-w-80 items-start gap-4">
						<Label>
							Start feed automatically
							<ToggleButtons
								slot="input"
								options={['Yes', 'No']}
								selected={waitToStartFeed.current ? 'No' : 'Yes'}
								on:input={(event) => {
									waitToStartFeed.current = event.detail === 'No'
								}}
							/>
						</Label>
						<Label>
							Mouse position tooltip
							<ToggleButtons
								slot="input"
								options={['On', 'Off']}
								selected={mousePostionTooltip}
								on:input={setMousePostionTooltip}
							/>
						</Label>
					</div>
				</div>
			</div>
		</section>

		<section
			class="flex flex-col gap-4 p-4"
			aria-labelledby={getPointCloudHeadingID}
		>
			<div class="flex flex-col gap-0.5">
				<SectionTitle
					title="GetPointCloud"
					api="rdk:component:camera"
					headingId={getPointCloudHeadingID}
				/>
				<p class="text-subtle-2 text-xs">
					Get depth measurement data from cameras with depth sensing support
				</p>
			</div>

			<Switch
				annotated
				on:change={setIsShowingPointcloud}
				on={isShowingPointcloud}
			/>

			{#if isShowingPointcloud}
				<Query
					query={pointcloudQuery}
					contentCx="h-6"
				>
					{#if pointcloudQuery.data}
						<PCDWidget data={pointcloudQuery.data} />
					{/if}
				</Query>
			{/if}
		</section>
	{/snippet}
</ConnectionStatus>
