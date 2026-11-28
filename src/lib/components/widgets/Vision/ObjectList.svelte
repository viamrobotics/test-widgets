<!--
@component
Lists the objects a vision service segmented: each object's point count and its geometries' values.
With `withPreview`, each row has a Preview button that opens the object alone in a scene.
-->
<script lang="ts">
	import type { PointCloudObject } from '@viamrobotics/sdk'

	import { Folder } from '@viamrobotics/prime-controls'

	import GeometryDetails from './GeometryDetails.svelte'
	import ObjectPreviewDialog from './ObjectPreviewDialog.svelte'

	interface Props {
		objects: PointCloudObject[]
		/** Off for a host that already draws the objects in a scene of its own. */
		withPreview: boolean
	}

	const { objects, withPreview }: Props = $props()

	const MISSING_VALUE = '-'

	// A PCD header names its point count on a `POINTS` line, ahead of the point data.
	const PCD_HEADER_BYTES = 1024
	const POINTS_LINE = /^POINTS\s+(\d+)/m

	const countPoints = ({ pointCloud }: PointCloudObject): string => {
		const header = new TextDecoder().decode(pointCloud.subarray(0, PCD_HEADER_BYTES))
		return POINTS_LINE.exec(header)?.[1] ?? MISSING_VALUE
	}

	const id = $props.id()
</script>

{#if objects.length === 0}
	<div class="flex min-w-0 items-center gap-2">
		<span
			id="{id}-none"
			class="text-subtle-1 w-31 shrink-0 truncate text-xs"
		>
			Objects
		</span>
		<span
			role="group"
			aria-labelledby="{id}-none"
			class="readout font-roboto-mono"
		>
			<span class="readout-value">{MISSING_VALUE}</span>
		</span>
	</div>
{:else}
	<ul
		aria-label="Objects"
		class="flex flex-col gap-2"
	>
		{#each objects as object, index (index)}
			{@const name = `Object ${String(index + 1)}`}
			<li class="flex min-w-0 flex-col gap-1">
				<div class="flex min-w-0 items-center gap-2">
					<span
						id="{id}-{index}"
						class="text-subtle-1 w-31 shrink-0 truncate text-xs"
					>
						{name}
					</span>
					<span
						role="group"
						aria-labelledby="{id}-{index}"
						class="readout font-roboto-mono"
					>
						<span class="readout-value">{countPoints(object)}</span>
						<span class="readout-suffix">points</span>
					</span>
					{#if withPreview}
						<ObjectPreviewDialog
							{object}
							{name}
						/>
					{/if}
				</div>
				{#if object.geometries && object.geometries.geometries.length > 0}
					<Folder title="Geometries">
						<GeometryDetails geometries={object.geometries} />
					</Folder>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
