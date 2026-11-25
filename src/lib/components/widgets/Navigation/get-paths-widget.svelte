<script lang="ts">
	import { NavigationClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { waypointLabel } from './waypoint-label'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'
	const REFETCH_INTERVAL_MS = 1000
	const POLL_HINT = 'Updates automatically'

	const client = createResourceClient(
		NavigationClient,
		() => partID,
		() => resourceName
	)

	const pathsQuery = createResourceQuery(client, 'getPaths', {
		refetchInterval: REFETCH_INTERVAL_MS,
	})

	// Same query and options as GetWaypoints, so the query cache shares one request.
	const waypointsQuery = createResourceQuery(client, 'getWayPoints', {
		refetchInterval: REFETCH_INTERVAL_MS,
	})

	const labelForDestination = (destinationWaypointId: string) => {
		const index = (waypointsQuery.data ?? []).findIndex(
			(waypoint) => waypoint.id === destinationWaypointId
		)
		if (index !== -1) return waypointLabel(index)
		return destinationWaypointId === '' ? MISSING_VALUE : destinationWaypointId
	}

	const rows = $derived(
		(pathsQuery.data ?? []).map((path, index) => ({
			key: `${path.destinationWaypointId}-${index}`,
			label: labelForDestination(path.destinationWaypointId),
			pointCount: path.geopoints.length,
		}))
	)

	const hasPaths = $derived(rows.length > 0)

	const pathsLabelId = $props.id()
</script>

<ApiSection
	method="GetPaths"
	api={ResourceTriplets.Navigation}
	queries={[pathsQuery, waypointsQuery]}
	class="grow flex-col gap-2"
>
	{#if hasPaths}
		<ul
			aria-label="Paths"
			class="flex flex-col gap-1"
		>
			{#each rows as row, index (row.key)}
				<li class="flex min-w-0 items-center gap-2">
					<span
						id="{pathsLabelId}-{index}"
						class="min-w-0 flex-1 truncate text-xs font-semibold"
					>
						{row.label}
					</span>
					<span
						role="group"
						aria-labelledby="{pathsLabelId}-{index}"
						class="readout font-roboto-mono"
					>
						<span class="readout-value">{row.pointCount}</span>
						<span class="readout-suffix">points</span>
					</span>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="flex min-w-0 items-center gap-2">
			<span
				id={pathsLabelId}
				class="text-subtle-1 truncate text-xs"
			>
				Paths
			</span>
			<span
				role="group"
				aria-labelledby={pathsLabelId}
				class="readout font-roboto-mono"
			>
				<span class="readout-value">{MISSING_VALUE}</span>
			</span>
		</div>
	{/if}
	<Section.Text class="mt-auto">{POLL_HINT}</Section.Text>
</ApiSection>
