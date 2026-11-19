<script lang="ts">
	import { NumberField } from '@viamrobotics/prime-controls'
	import { VisionClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { createCameraChoice } from './camera-choice.svelte'
	import CameraSelect from './camera-select.svelte'
	import ClassificationList from './classification-list.svelte'

	interface Props {
		partID: string
		resourceName: string
		/** The camera to read. Set, the widget draws no `Camera` row, and `''` is the service's default camera. */
		cameraName?: string
	}

	const { partID, resourceName, cameraName }: Props = $props()

	const REFETCH_INTERVAL_MS = 500
	const DEFAULT_COUNT = 3
	const MIN_COUNT = 1

	let count = $state<number | undefined>(DEFAULT_COUNT)

	// `n` is a count of results, so only a whole number of at least one is sent.
	const validCount = $derived(
		count !== undefined && Number.isInteger(count) && count >= MIN_COUNT ? count : undefined
	)

	const choice = createCameraChoice(() => partID)
	const activeCameraName = $derived(cameraName ?? choice.cameraName)

	const client = createResourceClient(
		VisionClient,
		() => partID,
		() => resourceName
	)

	const classificationsQuery = createResourceQuery(
		client,
		'getClassificationsFromCamera',
		(): Parameters<VisionClient['getClassificationsFromCamera']> => [
			activeCameraName,
			validCount ?? DEFAULT_COUNT,
		],
		() => ({ enabled: validCount !== undefined, refetchInterval: REFETCH_INTERVAL_MS })
	)
</script>

<ApiSection
	method="GetClassificationsFromCamera"
	api={ResourceTriplets.Vision}
	queries={[classificationsQuery]}
	class="grow flex-col gap-4"
>
	<div class="flex flex-col gap-2">
		{#if cameraName === undefined}
			<CameraSelect {choice} />
		{/if}
		<NumberField
			label="Count"
			class="max-w-60"
			min={MIN_COUNT}
			step={1}
			state={validCount === undefined ? 'error' : undefined}
			bind:value={count}
		/>
		<ClassificationList classifications={classificationsQuery.data ?? []} />
	</div>
	<Section.Text class="mt-auto">Updates automatically</Section.Text>
</ApiSection>
