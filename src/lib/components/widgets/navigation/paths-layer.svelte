<script lang="ts">
	import type { Path } from '@viamrobotics/sdk'
	import type { GeoJSONSource, Source } from 'maplibre-gl'

	import { themeColor } from '@viamrobotics/tailwind-config/theme-color'
	import { fromStore } from 'svelte/store'

	import { useMapLibre } from '$lib/components/maplibre'

	import { pathsToGeoJson } from './paths-geojson'

	interface Props {
		paths: Path[]
	}

	const { paths }: Props = $props()

	const SOURCE_ID = 'navigation-paths'
	const LAYER_ID = 'navigation-paths-line'
	const LINE_WIDTH = 3

	const context = useMapLibre()
	const map = fromStore(context.map)

	const data = $derived(pathsToGeoJson(paths))

	const isGeoJsonSource = (source: Source | undefined): source is GeoJSONSource =>
		source?.type === 'geojson'

	const addPathsLayer = (current: typeof map.current, geoJson: typeof data) => {
		current.addSource(SOURCE_ID, { type: 'geojson', data: geoJson })
		current.addLayer({
			id: LAYER_ID,
			type: 'line',
			source: SOURCE_ID,
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': themeColor('--color-info-bright') ?? '',
				'line-width': LINE_WIDTH,
			},
		})
	}

	// A style change, such as the satellite toggle, drops custom sources and layers, so each
	// style load draws them again.
	$effect(() => {
		const current = map.current
		const sync = () => {
			if (!current.isStyleLoaded()) return
			const source = current.getSource(SOURCE_ID)
			if (isGeoJsonSource(source)) {
				source.setData(data)
				return
			}
			addPathsLayer(current, data)
		}

		sync()
		current.on('styledata', sync)
		return () => {
			current.off('styledata', sync)
			if (current.getLayer(LAYER_ID)) current.removeLayer(LAYER_ID)
			if (current.getSource(SOURCE_ID)) current.removeSource(SOURCE_ID)
		}
	})
</script>
