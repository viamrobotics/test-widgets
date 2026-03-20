<!-- 
  @component
  Adds controls for toggling between a satellite and map view.
-->
<script lang="ts">
	import { Button } from '@viamrobotics/prime-core';

	import { useMapLibre } from '../hooks';
	import { getGoogleMapsStyle } from '../style';
	import { MapProviders } from '../types';

	const { map, satellite, mapProvider, apiKey, maxZoom } = useMapLibre();

	const onClick = () => {
		satellite.set(!$satellite);

		if ($mapProvider === MapProviders.googleMaps && $apiKey) {
			try {
				const style = getGoogleMapsStyle($apiKey, $maxZoom, $satellite ? 'satellite' : 'roadmap');
				map.setStyle(style);
			} catch (error) {
				/* eslint-disable-next-line no-console */
				console.error('Failed to toggle satellite view:', error);
				satellite.set(!$satellite);
			}
		} else {
			map.setLayoutProperty('satellite', 'visibility', $satellite ? 'visible' : 'none');
		}
	};
</script>

<Button onclick={onClick}>{$satellite ? 'Map' : 'Satellite'}</Button>
