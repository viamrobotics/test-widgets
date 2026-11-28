<!--
@component
Lists 3D detections. Each is a tree of transforms, root first: a row names the transform's frame and
the frame it is posed in, and a transform that carries a physical object lists its geometry.
-->
<script lang="ts">
	import type { Detection3D } from '@viamrobotics/sdk'

	import { Folder } from '@viamrobotics/prime-controls'
	import { GeometriesInFrame } from '@viamrobotics/sdk'

	import GeometryDetails from './GeometryDetails.svelte'

	interface Props {
		detections: Detection3D[]
	}

	const { detections }: Props = $props()

	const MISSING_VALUE = '-'

	const id = $props.id()
</script>

{#if detections.length === 0}
	<div
		role="group"
		aria-label="3D detections"
		class="flex min-w-0 items-center gap-2"
	>
		<span class="text-subtle-1 w-31 shrink-0 truncate text-xs">3D detections</span>
		<span class="readout font-roboto-mono">
			<span class="readout-value">{MISSING_VALUE}</span>
		</span>
	</div>
{:else}
	<ul
		aria-label="3D detections"
		class="flex flex-col gap-2"
	>
		{#each detections as detection, index (index)}
			<li class="flex min-w-0 flex-col gap-1">
				<Folder title="3D detection {String(index + 1)}">
					<ul class="flex flex-col gap-1">
						{#each detection.transforms as transform, place (place)}
							{@const rowId = `${id}-${String(index)}-${String(place)}`}
							{@const parentFrame = transform.poseInObserverFrame?.referenceFrame}
							<li class="flex min-w-0 flex-col gap-1">
								<div class="flex min-w-0 items-center gap-2">
									<span
										id={rowId}
										class="text-subtle-1 w-31 shrink-0 truncate text-xs"
										title={transform.referenceFrame}
									>
										{transform.referenceFrame || MISSING_VALUE}
									</span>
									<span
										role="group"
										aria-labelledby={rowId}
										class="readout font-roboto-mono min-w-0"
									>
										<span class="readout-prefix">in</span>
										<span class="readout-value truncate">{parentFrame || MISSING_VALUE}</span>
									</span>
								</div>
								{#if transform.physicalObject}
									<GeometryDetails
										geometries={new GeometriesInFrame({
											referenceFrame: transform.referenceFrame,
											geometries: [transform.physicalObject],
										})}
									/>
								{/if}
							</li>
						{/each}
					</ul>
				</Folder>
			</li>
		{/each}
	</ul>
{/if}
