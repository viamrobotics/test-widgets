<script lang="ts">
	import { type Detection, VisionClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import ChosenImageInput, { type ChosenImage } from './chosen-image-input.svelte'
	import DetectionList from './detection-list.svelte'
	import StillImageDetections from './still-image-detections.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		VisionClient,
		() => partID,
		() => resourceName
	)

	const detectionsMutation = createResourceMutation(client, 'getDetections')

	// The image and its detections are kept together, so the boxes always belong to the image drawn.
	let result = $state.raw<{ image: ChosenImage; detections: Detection[] }>()

	const execute = (image: ChosenImage) => {
		detectionsMutation.mutate([image.bytes, image.width, image.height, image.mimeType], {
			onSuccess: (detections) => {
				result = { image, detections }
			},
		})
	}
</script>

<ApiSection
	method="GetDetections"
	api={ResourceTriplets.Vision}
	mutations={[detectionsMutation]}
	class="grow flex-col gap-4"
>
	<ChosenImageInput onExecute={execute} />
	{#if result}
		<StillImageDetections
			file={result.image.file}
			width={result.image.width}
			height={result.image.height}
			detections={result.detections}
			alt="Chosen image {result.image.file.name}"
		/>
	{/if}
	<DetectionList detections={result?.detections ?? []} />
</ApiSection>
