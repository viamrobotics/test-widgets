<script lang="ts">
	import { NumberField } from '@viamrobotics/prime-controls'
	import { type Classification, VisionClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import ChosenImageInput, { type ChosenImage } from './ChosenImageInput.svelte'
	import ClassificationList from './ClassificationList.svelte'
	import StillImageDetections from './StillImageDetections.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const DEFAULT_COUNT = 3
	const MIN_COUNT = 1

	let count = $state<number | undefined>(DEFAULT_COUNT)

	// `n` is a count of results, so only a whole number of at least one is sent.
	const validCount = $derived(
		count !== undefined && Number.isInteger(count) && count >= MIN_COUNT ? count : undefined
	)

	const client = createResourceClient(
		VisionClient,
		() => partID,
		() => resourceName
	)

	const classificationsMutation = createResourceMutation(client, 'getClassifications')

	const BUSY_REASON = 'Wait for the classifications in flight to finish.'
	const INVALID_COUNT_REASON = 'Enter a whole count of at least 1.'

	const blockedReason = $derived.by(() => {
		if (validCount === undefined) return INVALID_COUNT_REASON
		return classificationsMutation.isPending ? BUSY_REASON : undefined
	})

	const statusText = $derived.by(() => {
		if (classificationsMutation.isPending) return 'Getting classifications.'
		return classificationsMutation.isError ? 'Get classifications failed' : ''
	})

	// The image and its classifications are kept together, so the rows always belong to the image drawn.
	let result = $state.raw<{ image: ChosenImage; classifications: Classification[] }>()

	const execute = (image: ChosenImage) => {
		if (validCount === undefined) {
			return
		}
		classificationsMutation.mutate(
			[image.bytes, image.width, image.height, image.mimeType, validCount],
			{
				onSuccess: (classifications) => {
					result = { image, classifications }
				},
			}
		)
	}
</script>

<ApiSection
	method="GetClassifications"
	api={ResourceTriplets.Vision}
	mutations={[classificationsMutation]}
	class="grow flex-col gap-4"
>
	<ChosenImageInput
		{blockedReason}
		{statusText}
		onExecute={execute}
	>
		<NumberField
			label="Count"
			class="max-w-60"
			min={MIN_COUNT}
			step={1}
			state={validCount === undefined ? 'error' : undefined}
			hint={validCount === undefined ? INVALID_COUNT_REASON : undefined}
			{...emptyOnClear(() => (count = undefined))}
			bind:value={count}
		/>
	</ChosenImageInput>
	{#if result}
		<StillImageDetections
			file={result.image.file}
			width={result.image.width}
			height={result.image.height}
			detections={[]}
			alt="Chosen image {result.image.file.name}"
		/>
	{/if}
	<ClassificationList classifications={result?.classifications ?? []} />
</ApiSection>
