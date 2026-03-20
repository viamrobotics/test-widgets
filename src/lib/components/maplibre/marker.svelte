<!--
  @component

  Creates a marker on a maplibre map. Must be a child of `<MapLibre>`.
  
  ```svelte
    <MapLibreMarker
      lngLat={{ lng: 0, lat: 0 }}
      scale={1}
      color={'blue'}
    />
  ```
-->
<script lang="ts">
	import { LngLat, Marker } from 'maplibre-gl'

	import { useMapLibre } from './hooks'

	interface Props {
		/** The longitude of the marker. */
		lng?: number
		/** The latitude of the marker. */
		lat?: number
		/** The rotation angle of the marker (clockwise, in degrees) */
		rotation?: number
		/** The relative size of the marker. */
		scale?: number
		/** The marker color. */
		color?: string
		/** The marker icon */
		element?: HTMLElement
	}

	const { lng = 0, lat = 0, rotation = 0, scale = 1, color = '', element }: Props = $props()

	const { map } = useMapLibre()

	const marker = $derived.by(() => {
		const value = new Marker(element ? { element, scale, color } : { scale, color })
		value.setLngLat(new LngLat(0, 0))
		value.getElement().style.zIndex = '1'
		return value
	})

	$effect.pre(() => {
		const currentMarker = marker
		currentMarker.addTo(map)
		return () => {
			currentMarker.remove()
		}
	})

	$effect.pre(() => {
		marker?.setLngLat(new LngLat(lng, lat))
	})

	$effect.pre(() => {
		marker?.setRotation(rotation)
	})
</script>
