<script lang="ts">
	import type { GeometriesInFrame, Geometry } from '@viamrobotics/sdk'

	import { Folder } from '@viamrobotics/prime-controls'

	interface Props {
		geometries: GeometriesInFrame
	}

	interface Cell {
		tag: string
		value: string
	}

	interface Group {
		label: string
		unit: string
		cells: Cell[]
	}

	const { geometries }: Props = $props()

	const id = $props.id()

	const MISSING_VALUE = '-'

	const formatNumber = (value: number | undefined): string => {
		if (value === undefined) return MISSING_VALUE
		return value.toFixed(3)
	}

	const getGeometryLabel = (geometry: Geometry, index: number): string => {
		const typeCase = geometry.geometryType.case ?? 'unknown'
		if (geometry.label) {
			return `${geometry.label} (${typeCase})`
		}
		return `${typeCase} ${index}`
	}

	const getShapeGroups = (geometry: Geometry): Group[] => {
		const { geometryType } = geometry

		switch (geometryType.case) {
			case 'box': {
				const dims = geometryType.value.dimsMm
				return [
					{
						label: 'Dimensions',
						unit: 'mm',
						cells: [
							{ tag: 'X', value: formatNumber(dims?.x) },
							{ tag: 'Y', value: formatNumber(dims?.y) },
							{ tag: 'Z', value: formatNumber(dims?.z) },
						],
					},
				]
			}
			case 'sphere': {
				return [
					{
						label: 'Radius',
						unit: 'mm',
						cells: [{ tag: 'R', value: formatNumber(geometryType.value.radiusMm) }],
					},
				]
			}
			case 'capsule': {
				const capsule = geometryType.value
				return [
					{
						label: 'Capsule',
						unit: 'mm',
						cells: [
							{ tag: 'Radius', value: formatNumber(capsule.radiusMm) },
							{ tag: 'Length', value: formatNumber(capsule.lengthMm) },
						],
					},
				]
			}
			default: {
				return []
			}
		}
	}

	const getGroups = (geometry: Geometry): Group[] => {
		const { center } = geometry
		const groups = getShapeGroups(geometry)
		if (!center) return groups
		return [
			...groups,
			{
				label: 'Position',
				unit: 'mm',
				cells: [
					{ tag: 'X', value: formatNumber(center.x) },
					{ tag: 'Y', value: formatNumber(center.y) },
					{ tag: 'Z', value: formatNumber(center.z) },
				],
			},
			{
				label: 'Rotation',
				unit: '°',
				cells: [{ tag: 'θ', value: formatNumber(center.theta) }],
			},
		]
	}
</script>

<div class="flex flex-col gap-2">
	{#each geometries.geometries as geometry, index (`${index}:${geometry.label}`)}
		<Folder
			title={getGeometryLabel(geometry, index)}
			open={index === 0}
		>
			<div class="flex flex-col gap-2">
				{#each getGroups(geometry) as group (group.label)}
					<div
						role="group"
						aria-label={group.label}
						class="flex flex-col gap-1"
					>
						<span class="text-subtle-1 text-xs">{group.label}</span>
						<div class="grid min-w-0 grid-cols-3 gap-1">
							{#each group.cells as cell (cell.tag)}
								<div class="flex min-w-0 flex-col gap-1">
									<span
										id="{id}-{index}-{group.label}-{cell.tag}"
										class="text-subtle-1 truncate text-xs">{cell.tag}</span
									>
									<span
										role="group"
										aria-labelledby="{id}-{index}-{group.label}-{cell.tag}"
										class="readout font-roboto-mono"
									>
										<span class="readout-value">{cell.value}</span>
										<span class="readout-suffix">{group.unit}</span>
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</Folder>
	{/each}

	{#if geometries.referenceFrame}
		<p class="text-subtle-2 text-xs">
			Reference frame: <span class="font-roboto-mono">{geometries.referenceFrame}</span>
		</p>
	{/if}
</div>
