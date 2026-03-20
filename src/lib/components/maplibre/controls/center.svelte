<!-- 
  @component
  Adds an lat, lng set of inputs for viewing and setting the map center.
-->
<script lang="ts">
	import { LngLat } from 'maplibre-gl';

	import { persisted } from '@viamrobotics/prime-core';

	import { useMapLibre, useMapLibreEvent } from '../hooks';
	import LngLatInput from '../lnglat-input.svelte';

	const { map, mapCenter } = useMapLibre();
	const lastPosition = persisted<{ center: LngLat; zoom: number }>(
		'viam-blocks-navigation-map-center',
		{
			center: map.getCenter(),
			zoom: map.getZoom()
		}
	);

	if ($lastPosition) {
		map.jumpTo({ center: $lastPosition.center, zoom: $lastPosition.zoom });
	}

	const handleInput = (center: LngLat) => {
		map.jumpTo({ center });
	};

	useMapLibreEvent('move', () => {
		lastPosition.set({
			center: map.getCenter(),
			zoom: map.getZoom()
		});
	});
</script>

<LngLatInput
	lng={$mapCenter.lng}
	lat={$mapCenter.lat}
	oninput={handleInput}
/>
