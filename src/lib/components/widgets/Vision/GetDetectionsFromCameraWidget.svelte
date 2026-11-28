<script lang="ts">
	import { VisionClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { createRefetchIntervalStore } from '#lib/components/refetch-interval-store.svelte.js'
	import RefetchController from '#lib/components/RefetchController.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import { createCameraChoice } from './camera-choice.svelte'
	import CameraSelect from './CameraSelect.svelte'
	import DetectionList from './DetectionList.svelte'

	interface Props {
		partID: string
		resourceName: string
		/** The camera to read. Set, the widget draws no `Camera` row, and `''` is the service's default camera. */
		cameraName?: string
	}

	const { partID, resourceName, cameraName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'vision/getDetectionsFromCamera'
	)

	const choice = createCameraChoice(() => partID)
	const activeCameraName = $derived(cameraName ?? choice.cameraName)

	const client = createResourceClient(
		VisionClient,
		() => partID,
		() => resourceName
	)

	const detectionsQuery = createResourceQuery(
		client,
		'getDetectionsFromCamera',
		(): Parameters<VisionClient['getDetectionsFromCamera']> => [activeCameraName],
		() => ({ refetchInterval: refetchInterval.current })
	)
</script>

<ApiSection
	method="GetDetectionsFromCamera"
	api={ResourceTriplets.Vision}
	queries={[detectionsQuery]}
	class="grow flex-col gap-4"
>
	<div class="flex flex-col gap-2">
		{#if cameraName === undefined}
			<CameraSelect {choice} />
		{/if}
		<DetectionList detections={detectionsQuery.data ?? []} />
	</div>
	<div class="mt-auto">
		<RefetchController
			{refetchInterval}
			queries={[detectionsQuery]}
		/>
	</div>
</ApiSection>
