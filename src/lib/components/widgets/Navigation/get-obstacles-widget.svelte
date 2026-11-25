<script lang="ts">
	import type { Geometry } from '@viamrobotics/sdk'

	import { Folder } from '@viamrobotics/prime-controls'
	import { NavigationClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	interface Row {
		label: string
		value: string
		unit?: string
	}

	interface ObstacleGeometry {
		title: string
		rows: Row[]
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'
	const REFETCH_INTERVAL_MS = 1000
	const MM_PER_M = 1000
	const METER_DIGITS = 3
	const DEGREE_DIGITS = 2
	const COORDINATE_DIGITS = 4

	const client = createResourceClient(
		NavigationClient,
		() => partID,
		() => resourceName
	)

	const obstaclesQuery = createResourceQuery(client, 'getObstacles', {
		refetchInterval: REFETCH_INTERVAL_MS,
	})

	const format = (value: number | undefined, digits: number): string =>
		value === undefined ? MISSING_VALUE : value.toFixed(digits)

	const meters = (valueMm: number | undefined): string =>
		format(valueMm === undefined ? undefined : valueMm / MM_PER_M, METER_DIGITS)

	const shapeRows = (geometry: Geometry): Row[] => {
		const { geometryType } = geometry
		switch (geometryType.case) {
			case 'box': {
				const dims = geometryType.value.dimsMm
				return [
					{ label: 'Shape', value: 'Box' },
					{ label: 'Length', value: meters(dims?.x), unit: 'm' },
					{ label: 'Width', value: meters(dims?.y), unit: 'm' },
					{ label: 'Height', value: meters(dims?.z), unit: 'm' },
				]
			}
			case 'sphere': {
				return [
					{ label: 'Shape', value: 'Sphere' },
					{ label: 'Radius', value: meters(geometryType.value.radiusMm), unit: 'm' },
				]
			}
			case 'capsule': {
				return [
					{ label: 'Shape', value: 'Capsule' },
					{ label: 'Radius', value: meters(geometryType.value.radiusMm), unit: 'm' },
					{ label: 'Length', value: meters(geometryType.value.lengthMm), unit: 'm' },
				]
			}
			default: {
				return [{ label: 'Shape', value: MISSING_VALUE }]
			}
		}
	}

	const geometries = $derived.by((): ObstacleGeometry[] =>
		(obstaclesQuery.data ?? []).flatMap((obstacle, obstacleIndex) =>
			obstacle.geometries.map((geometry) => ({
				title: geometry.label === '' ? `Obstacle ${obstacleIndex + 1}` : geometry.label,
				rows: [
					...shapeRows(geometry),
					{ label: 'θ', value: format(geometry.center?.theta, DEGREE_DIGITS), unit: '°' },
					{
						label: 'Latitude',
						value: format(obstacle.location?.latitude, COORDINATE_DIGITS),
						unit: '°',
					},
					{
						label: 'Longitude',
						value: format(obstacle.location?.longitude, COORDINATE_DIGITS),
						unit: '°',
					},
				],
			}))
		)
	)
</script>

{#snippet readout(row: Row)}
	<div
		role="group"
		aria-label={row.label}
		class="flex min-w-0 items-center gap-2"
	>
		<span class="text-subtle-1 w-24 shrink-0 truncate text-xs">{row.label}</span>
		<span class="readout font-roboto-mono min-w-0">
			<span class="readout-value">{row.value}</span>
			{#if row.unit !== undefined && row.value !== MISSING_VALUE}
				<span class="readout-suffix">{row.unit}</span>
			{/if}
		</span>
	</div>
{/snippet}

<ApiSection
	method="GetObstacles"
	api={ResourceTriplets.Navigation}
	queries={[obstaclesQuery]}
	class="grow flex-col gap-2"
>
	{#if geometries.length === 0}
		{@render readout({ label: 'Obstacles', value: MISSING_VALUE })}
	{:else}
		<div class="flex min-w-0 flex-col gap-2">
			{#each geometries as geometry, index (index)}
				<Folder
					title={geometry.title}
					open={index === 0}
				>
					<div class="flex min-w-0 flex-col gap-1">
						{#each geometry.rows as row (row.label)}
							{@render readout(row)}
						{/each}
					</div>
				</Folder>
			{/each}
		</div>
	{/if}
	<p class="text-subtle-2 text-xs">Updates automatically</p>
</ApiSection>
