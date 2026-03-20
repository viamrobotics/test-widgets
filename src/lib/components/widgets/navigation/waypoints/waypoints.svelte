<script lang="ts">
	import type { LngLat } from 'maplibre-gl';

	import { theme } from '@viamrobotics/prime-core/theme';
	import type { Waypoint as WaypointType } from '@viamrobotics/sdk';

	import { MapLibreMarker, useMapLibreEvent } from '$lib/components/maplibre';

	interface Props {
		waypoints: WaypointType[];
		addWayPoint: (_: LngLat) => void;
		tab: 'obstacles' | 'waypoints';
		hovered: string | null;
	}

	const { waypoints, addWayPoint, tab, hovered }: Props = $props();

	useMapLibreEvent('click', (event) => {
		if (tab === 'waypoints') {
			addWayPoint(event.lngLat);
		}
	});
</script>

{#each waypoints as waypoint (waypoint.id)}
	{#if waypoint.location}
		<MapLibreMarker
			lat={waypoint.location.latitude}
			lng={waypoint.location.longitude}
			scale={hovered === waypoint.id ? 1.25 : 1}
			color={hovered === waypoint.id ? theme.extend.colors['solar-power'] : ''}
		/>
	{/if}
{/each}
