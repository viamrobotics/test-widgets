<script lang="ts">
	import type { Map } from 'maplibre-gl';

	import { IconButton, Tooltip } from '@viamrobotics/prime-core';
	import type { Waypoint } from '@viamrobotics/sdk';

	interface Props {
		map?: Map | undefined;
		waypoints: Waypoint[];
		hovered: string | null;
		onEnter: (id: string) => void;
		onLeave: () => void;
		onRemove: (id: string) => void;
	}

	const { map, waypoints, hovered, onEnter, onLeave, onRemove }: Props = $props();

	const flyTo = (lng: number, lat: number) => {
		map?.flyTo({
			center: [lng, lat],
			zoom: 20,
			speed: 2
		});
	};
</script>

{#each waypoints as waypoint, index (waypoint.id)}
	{#if waypoint.location}
		<li
			class="group border-b-medium flex items-center justify-between border-b p-2 pl-2 last:border-b-0"
			class:bg-light={hovered === waypoint.id}
			onpointerenter={() => onEnter(waypoint.id)}
			onpointerleave={() => onLeave()}
		>
			<small class="max-w-[66%] overflow-hidden text-sm text-ellipsis">
				Waypoint {index + 1}
			</small>

			<div class="flex gap-1">
				<Tooltip let:tooltipID>
					<IconButton
						aria-describedby={tooltipID}
						icon="image-filter-center-focus"
						label="Focus waypoint {index + 1}"
						on:click={(event) => {
							if (!waypoint.location) {
								return;
							}

							event.stopPropagation();

							flyTo(waypoint.location.longitude, waypoint.location.latitude);
						}}
					/>

					<p slot="description">
						{waypoint.location.latitude.toString()}, {waypoint.location.longitude.toString()}
					</p>
				</Tooltip>

				<IconButton
					icon="trash-can-outline"
					label="Remove waypoint {index + 1}"
					on:click={() => onRemove(waypoint.id)}
				/>
			</div>
		</li>
	{/if}
{/each}
