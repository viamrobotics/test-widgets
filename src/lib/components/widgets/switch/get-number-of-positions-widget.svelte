<script lang="ts">
	import { SwitchClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
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

	const numberOfPositionsQuery = createResourceQuery(client, 'getNumberOfPositions')

	const positionCount = $derived(numberOfPositionsQuery.data?.[0] ?? MISSING_VALUE)
	const positionLabels = $derived(numberOfPositionsQuery.data?.[1] ?? [])

	const labelId = $props.id()
</script>

<ApiSection
	method="GetNumberOfPositions"
	api={ResourceTriplets.Switch}
	class="grow flex-col gap-1"
	queries={[numberOfPositionsQuery]}
>
	<div class="flex min-w-0 items-center gap-2">
		<span
			id={labelId}
			class="text-subtle-1 shrink-0 text-xs">Positions</span
		>
		<span
			role="group"
			class="readout font-roboto-mono"
			aria-labelledby={labelId}
		>
			<span class="readout-value">{positionCount}</span>
		</span>
	</div>
	{#each positionLabels as positionLabel, index (index)}
		<div class="flex min-w-0 items-center gap-2">
			<span
				id="{labelId}-{index}"
				class="text-subtle-1 shrink-0 text-xs">{index}</span
			>
			<span
				role="group"
				class="readout font-roboto-mono"
				aria-labelledby="{labelId}-{index}"
			>
				<span class="readout-value">{positionLabel}</span>
			</span>
		</div>
	{/each}
</ApiSection>
