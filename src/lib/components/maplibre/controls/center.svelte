<!-- 
  @component
  Adds an lat, lng set of inputs for viewing and setting the map center.
-->
<script lang="ts">
	import type { LngLat } from 'maplibre-gl'

	import { PersistedState } from 'runed'
	import { fromStore } from 'svelte/store'

	import { useMapLibre, useMapLibreEvent } from '../hooks.svelte'
	import LngLatInput from '../lnglat-input.svelte'

	const { center, ...context } = useMapLibre()
	const map = fromStore(context.map)

	const lastPosition = new PersistedState<{ center: { lng: number; lat: number }; zoom: number }>(
		'viam-blocks-navigation-map-center',
		{
			center: map.current.getCenter(),
			zoom: map.current.getZoom(),
		}
	)

	map.current.jumpTo({ center: lastPosition.current.center, zoom: lastPosition.current.zoom })

	const handleInput = (center: LngLat) => {
		map.current.jumpTo({ center })
	}

	useMapLibreEvent('move', () => {
		const { lng, lat } = map.current.getCenter()
		lastPosition.current = { center: { lng, lat }, zoom: map.current.getZoom() }
	})
</script>

<LngLatInput
	lng={$center.lng}
	lat={$center.lat}
	oninput={handleInput}
/>
