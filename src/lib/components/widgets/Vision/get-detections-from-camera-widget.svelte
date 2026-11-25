<script lang="ts">
	import { VisionClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { createCameraChoice } from './camera-choice.svelte'
	import CameraSelect from './camera-select.svelte'
	import DetectionList from './detection-list.svelte'

	interface Props {
		partID: string
		resourceName: string
		/** The camera to read. Set, the widget draws no `Camera` row, and `''` is the service's default camera. */
		cameraName?: string
	}

	const { partID, resourceName, cameraName }: Props = $props()

	const REFETCH_INTERVAL_MS = 500

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
		{ refetchInterval: REFETCH_INTERVAL_MS }
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
	<Section.Text class="mt-auto">Updates automatically</Section.Text>
</ApiSection>
