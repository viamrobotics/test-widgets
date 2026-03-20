if (!('createObjectURL' in globalThis.URL)) {
	throw new Error(
		'<MapLibre> requires the window.URL.createObjectURL method. If in a testing environment, this must be mocked or stubbed.'
	);
}

export { default as CenterControls } from './controls/center.svelte';
export { default as FollowControls } from './controls/follow.svelte';
export { default as NavigationControls } from './controls/navigation.svelte';
export { default as SatelliteControls } from './controls/satellite.svelte';
export { default as DirectionalMarker } from './directional-marker.svelte';
export { useMapLibre, useMapLibreEvent } from './hooks';
export { default as MapLibre } from './index.svelte';
export { default as LngLatInput } from './lnglat-input.svelte';
export { default as MapLibreMarker } from './marker.svelte';
export {
	lngLatToMercator,
	mercatorToCartesian,
	lngLatToCartesian,
	cartesianToMercator,
	cartesianToLngLat
} from './math';
export { useMapLibreThreeRaycast } from './plugins/raycast';
export { useMapLibreThreeRenderer } from './plugins/three.svelte';
export { MapProviders, type MapProvider, GeoPose, Waypoint } from './types';
