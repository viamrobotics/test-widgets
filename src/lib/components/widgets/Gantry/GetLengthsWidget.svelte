<script lang="ts">
	import { GantryClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { formatNumeric } from '#lib/format.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		GantryClient,
		() => partID,
		() => resourceName
	)

	// The axis lengths do not change while the gantry moves, so they are read once.
	const lengthsQuery = createResourceQuery(client, 'getLengths', { refetchInterval: false })

	const lengths = $derived(lengthsQuery.data ?? [])

	const labelId = $props.id()
</script>

<ApiSection
	method="GetLengths"
	api={ResourceTriplets.Gantry}
	queries={[lengthsQuery]}
	class="grow flex-col gap-1"
>
	{#snippet tooltip()}
		Returns the lengths of the axes of the gantry, in millimeters.
	{/snippet}
	<div
		role="group"
		aria-label="Axis lengths"
		class="flex min-w-0 flex-col gap-1"
	>
		{#each lengths as length, index (index)}
			<div class="flex min-w-0 items-center gap-2">
				<span
					id="{labelId}-{index}"
					class="text-subtle-1 w-14 shrink-0 text-xs">Axis {index}</span
				>
				<span
					role="group"
					class="readout font-roboto-mono"
					aria-labelledby="{labelId}-{index}"
				>
					<span class="readout-value">{formatNumeric(length)}</span>
					<span class="readout-suffix">mm</span>
				</span>
			</div>
		{/each}
	</div>
</ApiSection>
