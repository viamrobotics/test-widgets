<script lang="ts">
	import { SwitchClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'

	const client = createResourceClient(
		SwitchClient,
		() => partID,
		() => resourceName
	)

	const positionQuery = createResourceQuery(client, 'getPosition', {
		refetchInterval: 500,
	})
	const numberOfPositionsQuery = createResourceQuery(client, 'getNumberOfPositions')

	const positionIndex = $derived(positionQuery.data)
	const positionLabel = $derived(
		positionIndex === undefined ? undefined : numberOfPositionsQuery.data?.[1][positionIndex]
	)
	const hasPositionLabel = $derived(positionLabel !== undefined && positionLabel !== '')
	const primaryReading = $derived(
		hasPositionLabel ? positionLabel : (positionIndex ?? MISSING_VALUE)
	)

	const labelId = $props.id()
</script>

<ApiSection
	method="GetPosition"
	api={ResourceTriplets.Switch}
	class="grow flex-col gap-2"
	queries={[positionQuery, numberOfPositionsQuery]}
>
	<div class="flex min-w-0 items-center gap-2">
		<span
			id={labelId}
			class="text-subtle-1 shrink-0 text-xs">Position</span
		>
		<span
			role="group"
			class="readout font-roboto-mono"
			aria-labelledby={labelId}
		>
			<span class="readout-value">{primaryReading}</span>
			{#if hasPositionLabel && positionIndex !== undefined}
				<span class="readout-suffix">{positionIndex}</span>
			{/if}
		</span>
	</div>
	<Section.Text>Updates automatically</Section.Text>
</ApiSection>
