<script lang="ts">
	import { Button, Label, Select, Switch, ToggleButtons } from '@viamrobotics/prime-core'
	import { CameraClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import { useAddImageToDataset } from '$lib/add-image-to-dataset'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import Query from '$lib/components/query.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import {
		createRefetchIntervalStore,
		RefetchIntervals,
	} from '$lib/components/refetch-interval-store.svelte'

	import PCDWidget from '../pcd/pcd-widget.svelte'
	import ExportScreenshot from './export-screenshot.svelte'
	import { getSourceNames } from './get-source-names'
	import LiveOrPollingVideo from './live-or-polling-video.svelte'
	import PictureInPictureButton from './picture-in-picture-button.svelte'

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
	let isPlaying = $state(false)
	let isShowingPointcloud = $state(false)
	let selectedSource = $state('')
	let sourceNames = $state<string[]>([])

	const { addImageToDataset } = useAddImageToDataset()
	const setIsShowingPointcloud = (event: CustomEvent<boolean>) => {
		isShowingPointcloud = event.detail
	}

	const client = createResourceClient(
		CameraClient,
		() => partID,
		() => resourceName
	)

	const imageQuery = createResourceQuery(
		client,
		'getImages',
		() => (selectedSource ? ([[selectedSource]] as [string[]]) : ([] as [])),
		() => ({
			enabled: isPlaying && refetchInterval.current !== RefetchIntervals.LIVE,
			refetchInterval: refetchInterval.current,
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
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		{#if isPlaying}
			<div class="flex gap-4 p-4 pb-3">
				<RefetchController
					{refetchInterval}
					allowLive
					queries={[imageQuery, pointcloudQuery]}
				/>
				{#if sourceNames.length > 0 && refetchInterval.current !== RefetchIntervals.LIVE}
					<Label position="left">
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
			</div>
		{/if}
		<div class="flex h-full w-full gap-4 p-4">
			<div class="grow">
				{#if isPlaying}
					<LiveOrPollingVideo
						{partID}
						{resourceName}
						showResolutionOptions
						isLive={refetchInterval.current === RefetchIntervals.LIVE}
						data={imageQuery.data}
						error={imageQuery.error}
						isLoading={imageQuery.isLoading}
						refetch={imageQuery.refetch}
						showMousePositionTooltip={mousePostionTooltip === 'On'}
					/>
				{:else}
					<div
						class="bg-medium flex h-64 w-80 items-center justify-center"
						aria-label={`${resourceName} feed paused`}
					>
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
			</div>
			{#if isPlaying}
				<div class="flex flex-col items-start gap-2">
					<ExportScreenshot
						name={client.current?.name ?? ''}
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

								const image = imgData?.images?.[0]?.image
								const mimeType = imgData?.images?.[0]?.mimeType

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
							Add current image to dataset
						</Button>
					{/if}
					{#if !isFirefox}
						<PictureInPictureButton
							{resourceName}
							rate={refetchInterval.current}
						/>
					{/if}
					<Label>
						Mouse Position Tooltip

						<ToggleButtons
							slot="input"
							options={['On', 'Off']}
							selected={mousePostionTooltip}
							on:input={setMousePostionTooltip}
						/>
					</Label>
				</div>
			{/if}
		</div>

		<section
			class="flex flex-col gap-4 p-4"
			aria-labelledby={headingID}
		>
			<div>
				<h3
					id={headingID}
					class="pb-1.5 font-semibold"
				>
					GetPointCloud
				</h3>
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
