<script lang="ts">
	import { NavigationClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'
	const REFETCH_INTERVAL_MS = 1000

	const client = createResourceClient(
		NavigationClient,
		() => partID,
		() => resourceName
	)

	const query = createResourceQuery(client, 'getLocation', {
		refetchInterval: REFETCH_INTERVAL_MS,
	})

	const numberText = (value: number | undefined) =>
		value === undefined ? MISSING_VALUE : String(value)

	const readouts = $derived([
		{ label: 'Latitude', value: query.data?.location?.latitude },
		{ label: 'Longitude', value: query.data?.location?.longitude },
		{ label: 'Compass heading', value: query.data?.compassHeading },
	])
</script>

<ApiSection
	method="GetLocation"
	api={ResourceTriplets.Navigation}
	queries={[query]}
	class="grow flex-col gap-2"
>
	<div
		role="group"
		aria-label="Location"
		class="flex flex-wrap gap-x-4 gap-y-2"
	>
		{#each readouts as readout (readout.label)}
			<div class="flex min-w-0 flex-col gap-0.5">
				<span class="text-subtle-1 truncate text-xs">{readout.label}</span>
				<span class="readout font-roboto-mono">
					<span class="readout-value">{numberText(readout.value)}</span>
					{#if readout.value !== undefined}
						<span class="readout-suffix">°</span>
					{/if}
				</span>
			</div>
		{/each}
	</div>
</ApiSection>
