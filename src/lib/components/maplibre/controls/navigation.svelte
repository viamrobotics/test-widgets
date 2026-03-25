<!-- 
  @component
  
  Adds a set of maplibre navigation controls.

  @example

  ```html
    <MapLibre>
      <NavigationControls />
    </MapLibre>
  ```

  @see https://maplibre.org/maplibre-gl-js/docs/API/classes/NavigationControl/
-->
<script lang="ts">
	import { type ControlPosition, NavigationControl } from 'maplibre-gl'

	import { useMapLibre } from '../hooks'

	interface Props {
		position?: ControlPosition
		showCompass?: boolean
		showZoom?: boolean
		visualizePitch?: boolean
	}

	const {
		position = 'top-right',
		showCompass = true,
		showZoom = true,
		visualizePitch = true,
	}: Props = $props()

	const { map } = useMapLibre()
	const control = new NavigationControl()

	$effect(() => {
		control.options.showCompass = showCompass
	})

	$effect(() => {
		control.options.showZoom = showZoom
	})

	$effect(() => {
		control.options.visualizePitch = visualizePitch
	})

	$effect(() => {
		map.addControl(control, position)

		return () => {
			map.removeControl(control)
		}
	})
</script>
