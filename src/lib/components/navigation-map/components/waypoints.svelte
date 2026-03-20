<script lang="ts">
	import { MapLibreMarker } from '../../maplibre';
	import { useNavigationMap } from '../use-navigation-map.svelte';

	const nav = useNavigationMap();
</script>

{#each nav.waypoints as waypoint (waypoint.id)}
	<MapLibreMarker
		scale={0.7}
		lng={waypoint.lng}
		lat={waypoint.lat}
	/>
{/each}
