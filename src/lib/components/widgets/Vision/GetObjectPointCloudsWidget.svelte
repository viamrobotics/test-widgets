<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'
	import { VisionClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import { Section } from '#lib/components/Section/index.js'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import { createCameraChoice } from './camera-choice.svelte'
	import CameraSelect from './CameraSelect.svelte'
	import ObjectList from './ObjectList.svelte'

	interface Props {
		partID: string
		resourceName: string
		/**
		 * The camera to read, set by a host that renders one shared `Camera` row. Set, the widget
		 * renders no `Camera` row of its own. `''` is the service's default camera.
		 */
		cameraName?: string
	}

	const { partID, resourceName, cameraName }: Props = $props()

	const BUSY_REASON = 'Wait for the object point clouds in flight to finish.'

	const cameraChoice = createCameraChoice(() => partID)

	const requestedCameraName = $derived(cameraName ?? cameraChoice.cameraName)

	const client = createResourceClient(
		VisionClient,
		() => partID,
		() => resourceName
	)

	// Object point clouds are large and slow, so they are fetched only when the button is pressed.
	const objectsQuery = createResourceQuery(
		client,
		'getObjectPointClouds',
		(): Parameters<VisionClient['getObjectPointClouds']> => [requestedCameraName],
		{ enabled: false }
	)

	let hasLastFetchFailed = $state(false)

	// The button stays focusable while a fetch is in flight, so a press then is dropped here.
	const fetchObjects = async () => {
		if (objectsQuery.isFetching) return
		hasLastFetchFailed = false
		const { error } = await objectsQuery.refetch()
		hasLastFetchFailed = Boolean(error)
	}

	const statusText = $derived.by(() => {
		if (objectsQuery.isFetching) return 'Getting object point clouds.'
		return hasLastFetchFailed ? 'Get object point clouds failed' : ''
	})
</script>

<ApiSection
	class="min-w-0 grow flex-col gap-2"
	method="GetObjectPointClouds"
	api={ResourceTriplets.Vision}
	queries={[objectsQuery]}
>
	<div class="flex flex-col gap-2">
		{#if cameraName === undefined}
			<CameraSelect choice={cameraChoice} />
		{/if}
		<div class="flex justify-end">
			<HeldBack reason={objectsQuery.isFetching ? BUSY_REASON : undefined}>
				{#snippet children(heldBack)}
					<button
						type="button"
						class="button button-compact"
						{...heldBack}
						onclick={fetchObjects}
					>
						<Icon
							icon={mdiPlayCircleOutline}
							size="sm"
						/>
						Get object point clouds
					</button>
				{/snippet}
			</HeldBack>
		</div>
		<StatusLine text={statusText} />
	</div>

	<ObjectList
		objects={objectsQuery.data ?? []}
		withPreview
	/>
	{#if objectsQuery.data === undefined}
		<Section.Text>Press Get object point clouds to fetch. The query is large and slow.</Section.Text
		>
	{/if}
</ApiSection>
