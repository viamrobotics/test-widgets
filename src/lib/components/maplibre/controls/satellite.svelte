<!-- 
  @component
  Adds controls for toggling between a satellite and map view.
-->
<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'
	import { fromStore } from 'svelte/store'

	import { useMapLibre } from '../hooks.svelte'
	import { getGoogleMapsStyle } from '../style'
	import { MapProviders } from '../types'

	const { satellite, mapProvider, apiKey, maxZoom, ...context } = useMapLibre()
	const map = fromStore(context.map)

	const onClick = () => {
		satellite.set(!$satellite)

		if ($mapProvider === MapProviders.googleMaps && $apiKey) {
			try {
				const style = getGoogleMapsStyle($apiKey, $maxZoom, $satellite ? 'satellite' : 'roadmap')
				map.current.setStyle(style)
			} catch (error) {
				console.error('Failed to toggle satellite view:', error)
				satellite.set(!$satellite)
			}
		} else {
			map.current.setLayoutProperty('satellite', 'visibility', $satellite ? 'visible' : 'none')
		}
	}
</script>

<Button onclick={onClick}>{$satellite ? 'Map' : 'Satellite'}</Button>
