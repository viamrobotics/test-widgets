<script lang="ts">
	import { NavigationClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { waypointLabel } from './waypoint-label'

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

	const waypointsQuery = createResourceQuery(client, 'getWayPoints', {
		refetchInterval: REFETCH_INTERVAL_MS,
	})

	const rows = $derived(
		(waypointsQuery.data ?? []).map((waypoint, index) => ({
			id: waypoint.id,
			label: waypointLabel(index),
			location: waypoint.location
				? `${waypoint.location.latitude}, ${waypoint.location.longitude}`
				: MISSING_VALUE,
		}))
	)
</script>

<ApiSection
	method="GetWaypoints"
	api={ResourceTriplets.Navigation}
	queries={[waypointsQuery]}
	class="grow flex-col gap-2"
>
	{#if rows.length === 0}
		<span class="readout font-roboto-mono">
			<span class="readout-value">{MISSING_VALUE}</span>
		</span>
	{:else}
		<ul
			aria-label="Waypoints"
			class="flex flex-col gap-1"
		>
			{#each rows as row (row.id)}
				<li class="flex min-w-0 flex-col">
					<span class="truncate text-xs font-semibold">{row.label}</span>
					<span class="text-subtle-2 truncate text-xs">{row.location}</span>
				</li>
			{/each}
		</ul>
	{/if}
</ApiSection>
