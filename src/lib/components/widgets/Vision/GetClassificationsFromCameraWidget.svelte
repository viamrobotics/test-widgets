<script lang="ts">
	import { NumberField } from '@viamrobotics/prime-controls'
	import { VisionClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'
	import { createRefetchIntervalStore } from '#lib/components/refetch-interval-store.svelte.js'
	import RefetchController from '#lib/components/RefetchController.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import { createCameraChoice } from './camera-choice.svelte'
	import CameraSelect from './CameraSelect.svelte'
	import ClassificationList from './ClassificationList.svelte'

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
		'vision/getClassificationsFromCamera'
	)
	const DEFAULT_COUNT = 3
	const MIN_COUNT = 1
	const INVALID_COUNT_HINT = 'Enter a whole count of at least 1.'

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
		() => ({ enabled: validCount !== undefined, refetchInterval: refetchInterval.current })
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
			hint={validCount === undefined ? INVALID_COUNT_HINT : undefined}
			{...emptyOnClear(() => (count = undefined))}
			bind:value={count}
		/>
		<ClassificationList classifications={classificationsQuery.data ?? []} />
	</div>
	<div class="mt-auto">
		<RefetchController
			{refetchInterval}
			queries={[classificationsQuery]}
		/>
	</div>
</ApiSection>
