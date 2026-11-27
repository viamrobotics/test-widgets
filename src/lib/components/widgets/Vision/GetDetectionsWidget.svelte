<script lang="ts">
	import { type Detection, VisionClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import ChosenImageInput, { type ChosenImage } from './ChosenImageInput.svelte'
	import DetectionList from './DetectionList.svelte'
	import StillImageDetections from './StillImageDetections.svelte'

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

	const BUSY_REASON = 'Wait for the detections in flight to finish.'

	const statusText = $derived.by(() => {
		if (detectionsMutation.isPending) return 'Getting detections.'
		return detectionsMutation.isError ? 'Get detections failed' : ''
	})

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
	<ChosenImageInput
		blockedReason={detectionsMutation.isPending ? BUSY_REASON : undefined}
		{statusText}
		onExecute={execute}
	/>
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
