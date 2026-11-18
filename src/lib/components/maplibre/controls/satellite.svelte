<!-- 
  @component
  Adds controls for toggling between a satellite and map view.
-->
<script lang="ts">
	import { Checkbox, Field, Label } from '@viamrobotics/prime-ui'
	import { fromStore } from 'svelte/store'

	import { useMapLibre } from '../hooks.svelte'
	import { getGoogleMapsStyle } from '../style'
	import { MapProviders } from '../types'

	const { satellite, mapProvider, apiKey, maxZoom, ...context } = useMapLibre()
	const map = fromStore(context.map)

	const setSatellite = (checked: boolean) => {
		satellite.set(checked)

		if ($mapProvider === MapProviders.googleMaps && $apiKey) {
			try {
				const style = getGoogleMapsStyle($apiKey, $maxZoom, checked ? 'satellite' : 'roadmap')
				map.current.setStyle(style)
			} catch (error) {
				console.error('Failed to toggle satellite view:', error)
				satellite.set(!checked)
			}
		} else {
			map.current.setLayoutProperty('satellite', 'visibility', checked ? 'visible' : 'none')
		}
	}
</script>

<Field class="flex items-center gap-2">
	<Checkbox bind:checked={() => $satellite, setSatellite} />
	<Label>Satellite</Label>
</Field>
