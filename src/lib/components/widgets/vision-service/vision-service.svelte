<script lang="ts">
	import { IconButton, Label, Select, Switch, Tooltip } from '@viamrobotics/prime-core'
	import { VisionClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceQuery,
		useResourceStatuses,
	} from '@viamrobotics/svelte-sdk'

	import { useAddImageToDataset } from '$lib/add-image-to-dataset'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import Queries from '$lib/components/queries.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'

	import Image from './image.svelte'
	import ObjectPointClouds from './object-point-clouds.svelte'
	import { useSlowRequest } from './use-slow-request.svelte.ts'

	const { addImageToDataset } = useAddImageToDataset()

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'vision-service'
	)

	// special casing this for performance reasons
	const getObjectPointCloudsRefetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'vision-service-get-object-point-clouds',
		// default of manual refresh
		false
	)

	let initialFetchComplete = $state(false)
	let cameraName = $state('')
	let showObjectPointClouds = $state(false)
	let isRemote = $state(false)

	const cameraStatuses = useResourceStatuses(() => partID, 'camera')

	const cameras = $derived(
		cameraStatuses.current
			.map((status) => status.name?.name)
			.filter((name): name is string => name !== undefined)
	)

	$effect.pre(() => {
		if (cameras.length > 0 && !initialFetchComplete) {
			initialFetchComplete = true
			cameraName = cameras[0] ?? ''
		}
	})

	$effect.pre(() => {
		if (isRemote && cameraName.includes(':')) {
			// ignore first segment of remote name
			const [, ...remoteName] = cameraName.split(':')
			cameraName = remoteName.join(':')
		}
	})

	const client = createResourceClient(
		VisionClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties', () => ({
		// Lower bound of 1Hz for getProperties, higher frequencies are wasteful.
		refetchInterval:
			refetchInterval.current === false
				? false
				: (Math.max(refetchInterval.current, 1000) as number | false),
	}))

	const captureAllQuery = createResourceQuery(
		client,
		'captureAllFromCamera',
		() =>
			[
				cameraName,
				{
					returnImage: true,
					returnClassifications: Boolean(propertiesQuery.data?.classificationsSupported),
					returnDetections: Boolean(propertiesQuery.data?.detectionsSupported),
					returnObjectPointClouds: false,
				},
			] as const,
		() => ({
			// Lower bound of 20Hz
			refetchInterval:
				refetchInterval.current === false
					? false
					: (Math.max(refetchInterval.current, 1000 / 20) as number | false),
		})
	)

	const getObjectPointCloudsQuery = createResourceQuery(client, 'getObjectPointClouds', () => ({
		// Lower bound of 20Hz
		refetchInterval:
			getObjectPointCloudsRefetchInterval.current === false || !showObjectPointClouds
				? false
				: (Math.max(getObjectPointCloudsRefetchInterval.current, 1000 / 20) as number | false),
	}))

	const captureAllSlow = useSlowRequest(() => captureAllQuery.isFetching)
	const propertiesSlow = useSlowRequest(() => propertiesQuery.isFetching)
	const objectPointCloudsSlow = useSlowRequest(() => getObjectPointCloudsQuery.isFetching)

	const onCameraSelect = (event: Event) => {
		const { value } = event.target as HTMLSelectElement
		cameraName = value
	}

	const detectionsSlow = $derived(captureAllSlow.isSlow || propertiesSlow.isSlow)
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="flex flex-col gap-2 px-4 pt-4 pb-3">
			<div class="flex flex-wrap gap-4">
				<div class="w-50 max-w-full">
					<Label position="top">
						Camera
						<Select
							on:change={onCameraSelect}
							slot="input"
						>
							<option
								value=""
								selected={cameraName === ''}
							>
								Default camera
							</option>
							{#each cameras as name (name)}
								<option
									selected={cameraName === name}
									value={name}
								>
									{name}
								</option>
							{/each}
						</Select>
					</Label>
				</div>
				<div class="w-fit">
					<Label position="top">
						Is remote?
						<Switch
							slot="input"
							bind:on={isRemote}
						/>
					</Label>
				</div>
			</div>

			<h6 class="text-subtle-1 font-semibold">Detections/Classifications</h6>

			<div class="flex flex-wrap gap-4">
				<RefetchController
					allowLive
					{refetchInterval}
					queries={[propertiesQuery, captureAllQuery]}
				/>

				{#if addImageToDataset}
					<Tooltip let:tooltipID>
						<IconButton
							aria-describedby={tooltipID}
							variant="secondary"
							icon="camera-outline"
							label="add image to dataset"
							on:click={() => {
								const imgData = captureAllQuery.data?.image?.image

								if (imgData) {
									addImageToDataset({
										binaryData: imgData,
										partID,
										componentType: 'camera',
										componentName: resourceName,
										methodName: 'captureAllFromCamera',
										mimeType: 'image/png',
										dataRequestTimes: [new Date(), new Date()],
									})
								}
							}}
						/>
						<p slot="description">Add image to dataset</p>
					</Tooltip>
				{/if}
			</div>

			{#if detectionsSlow}
				<p class="text-subtle-2 text-xs italic">This request is taking a long time to complete.</p>
			{/if}

			<Queries
				queries={[propertiesQuery, captureAllQuery]}
				contentCx="p-4 h-14"
			>
				{#if detectionsSlow}
					<p class="text-subtle-2 text-xs italic">
						This request is taking a long time to complete.
					</p>
				{/if}
				{#if captureAllQuery.data}
					<Image
						data={captureAllQuery.data}
						detectionsSupported={Boolean(propertiesQuery.data?.detectionsSupported)}
						classificationsSupported={Boolean(propertiesQuery.data?.classificationsSupported)}
					/>
				{/if}
			</Queries>

			<h6 class="text-subtle-1 mt-4 font-semibold">Object point clouds</h6>
			<div class="flex flex-wrap items-center gap-4">
				<div class="w-50 max-w-full">
					<Label position="left">
						Show object point clouds
						<Switch
							slot="input"
							bind:on={showObjectPointClouds}
						/>
					</Label>
				</div>
				<RefetchController
					refetchInterval={getObjectPointCloudsRefetchInterval}
					queries={[getObjectPointCloudsQuery]}
				/>
			</div>

			{#if showObjectPointClouds && objectPointCloudsSlow}
				<p class="text-subtle-2 text-xs italic">This request is taking a long time to complete.</p>
			{/if}

			{#if showObjectPointClouds}
				<Queries
					queries={[getObjectPointCloudsQuery]}
					contentCx="p-4 h-14"
				>
					{#if objectPointCloudsSlow.isSlow}
						<p class="text-subtle-2 text-xs italic">
							This request is taking a long time to complete.
						</p>
					{/if}
					{#if getObjectPointCloudsQuery.data !== undefined}
						<ObjectPointClouds objects={getObjectPointCloudsQuery.data} />
					{/if}
				</Queries>
			{/if}
		</div>
	{/snippet}
</ConnectionStatus>
