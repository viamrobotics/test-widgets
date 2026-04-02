<!-- 
  @component
  Adds an lat, lng set of inputs for viewing and setting the map center.
-->
<script lang="ts">
	import { persisted } from '@viamrobotics/prime-core'
	import { LngLat } from 'maplibre-gl'
	import { fromStore } from 'svelte/store'

	import { useMapLibre, useMapLibreEvent } from '../hooks.svelte'
	import LngLatInput from '../lnglat-input.svelte'

	const { center, ...context } = useMapLibre()
	const map = fromStore(context.map)

	const lastPosition = persisted<{ center: LngLat; zoom: number }>(
		'viam-blocks-navigation-map-center',
		{
			center: map.current.getCenter(),
			zoom: map.current.getZoom(),
		}
	)

	if ($lastPosition) {
		map.current.jumpTo({ center: $lastPosition.center, zoom: $lastPosition.zoom })
	}

	const handleInput = (center: LngLat) => {
		map.current.jumpTo({ center })
	}

	useMapLibreEvent('move', () => {
		lastPosition.set({
			center: map.current.getCenter(),
			zoom: map.current.getZoom(),
		})
	})
</script>

<LngLatInput
	lng={$center.lng}
	lat={$center.lat}
	oninput={handleInput}
/>
