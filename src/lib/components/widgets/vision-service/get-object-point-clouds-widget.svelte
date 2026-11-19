<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'
	import { VisionClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { createCameraChoice } from './camera-choice.svelte'
	import CameraSelect from './camera-select.svelte'
	import ObjectPointClouds from './object-point-clouds.svelte'

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

	const MISSING_VALUE = '-'

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

	const objects = $derived(objectsQuery.data ?? [])

	const fetchObjects = () => {
		void objectsQuery.refetch()
	}

	const objectsLabelId = $props.id()
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
			<button
				type="button"
				class="button button-compact"
				disabled={objectsQuery.isFetching}
				aria-busy={objectsQuery.isFetching}
				onclick={fetchObjects}
			>
				<Icon
					icon={mdiPlayCircleOutline}
					size="sm"
				/>
				Get object point clouds
			</button>
		</div>
	</div>

	{#if objects.length > 0}
		<ObjectPointClouds
			{objects}
			isFramed
		/>
	{:else}
		<div class="flex min-w-0 items-center gap-2">
			<span
				id={objectsLabelId}
				class="text-subtle-1 w-31 shrink-0 text-xs"
			>
				Objects
			</span>
			<span
				role="group"
				aria-labelledby={objectsLabelId}
				class="readout font-roboto-mono"
			>
				<span class="readout-value">{MISSING_VALUE}</span>
			</span>
		</div>
		{#if objectsQuery.data === undefined}
			<Section.Text
				>Press Get object point clouds to fetch. The query is large and slow.</Section.Text
			>
		{/if}
	{/if}
</ApiSection>
