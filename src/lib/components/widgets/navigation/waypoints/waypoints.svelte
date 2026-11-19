<script lang="ts">
	import type { Waypoint as WaypointType } from '@viamrobotics/sdk'
	import type { LngLat } from 'maplibre-gl'

	import { themeColor } from '@viamrobotics/tailwind-config/theme-color'

	import { MapLibreMarker, useMapLibreEvent } from '$lib/components/maplibre'

	interface Props {
		waypoints: WaypointType[]
		addWayPoint: (_: LngLat) => void
		hovered: string | null
	}

	const { waypoints, addWayPoint, hovered }: Props = $props()

	// MapLibre writes the marker color into an SVG fill attribute, which does not resolve var(...).
	const hoveredMarkerColor = themeColor('--color-solar-power-bright')

	useMapLibreEvent('click', (event) => {
		addWayPoint(event.lngLat)
	})
</script>

{#each waypoints as waypoint (waypoint.id)}
	{#if waypoint.location}
		<MapLibreMarker
			lat={waypoint.location.latitude}
			lng={waypoint.location.longitude}
			scale={hovered === waypoint.id ? 1.25 : 1}
			color={hovered === waypoint.id ? hoveredMarkerColor : ''}
		/>
	{/if}
{/each}
