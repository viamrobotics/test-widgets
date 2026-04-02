<!--
  @component

  Creates a maplibre-gl map that will fill its parent.

  Children will mount once the map is fully loaded.

  ```svelte
    <MapLibre mapProvider="open-street">
      <MapLibreMarker lngLat={{ lng: 0, lat: 0 }} />
    </MapLibre>
  ```

  ```svelte
    <MapLibre mapProvider="google-maps" mapProviderKey="mycoolkey">
      <MapLibreMarker lngLat={{ lng: 0, lat: 0 }} />
    </MapLibre>
  ```
-->

<script lang="ts">
	import 'maplibre-gl/dist/maplibre-gl.css'

	import type { ClassValue, HTMLAttributes } from 'svelte/elements'

	import { LngLat, Map, type MapOptions } from 'maplibre-gl'
	import { onMount, type Snippet, tick } from 'svelte'

	import { provideMapContext } from './hooks'
	import { getStyleSpecification } from './style'
	import { type MapProvider, MapProviders } from './types'
	import { DEFAULT_MAX_ZOOM } from './zoom'

	interface Props extends HTMLAttributes<HTMLDivElement> {
		/** The minimum camera pitch. */
		minPitch?: number
		/** The maximum camera pitch. */
		maxPitch?: number
		/** The map zoom. */
		zoom?: number
		/** The maximum zoom level of the map (0-24). */
		minZoom?: number
		/** The maximum zoom level of the map (0-24). */
		maxZoom?: number
		/** The class name to apply to the map container. */
		class?: ClassValue

		/**
		 * The map center.
		 *
		 * @default { lng: -73.984421, lat: 40.7718116 }
		 * The Viam Robotics office.
		 */
		center?: LngLat

		/** A binding to the MapLibre Map instance */
		map?: Map
		options?: Partial<MapOptions>

		/**
		 * The map provider to use.
		 *
		 * @default 'open-street'
		 */
		mapProvider?: MapProvider

		/**
		 * The API key for the map provider.
		 *
		 * @default undefined
		 */
		mapProviderKey?: string

		/**
		 * Whether to show the satellite view.
		 *
		 * @default false
		 */
		satellite?: boolean

		children?: Snippet
		layer?: Snippet

		/** Fired after the map has been created. */
		onCreate?: (map: Map) => void
		/** Fired when the map camera moves. */
		onMove?: (map: Map) => void
		/** Fired when the map resizes. */
		onResize?: (map: Map) => void
	}

	let {
		minPitch = 0,
		maxPitch = 60,
		zoom = 9,
		minZoom = 0,
		maxZoom = DEFAULT_MAX_ZOOM,
		class: className,
		center = new LngLat(-73.984_421, 40.771_811_6),
		map = $bindable(),
		options,
		mapProvider = MapProviders.openStreet,
		mapProviderKey,
		satellite = false,
		onCreate,
		onMove,
		onResize,
		children,
		layer,
		...rest
	}: Props = $props()

	const context = provideMapContext(center, zoom, maxZoom, mapProvider, mapProviderKey, satellite)

	let container = $state.raw<HTMLDivElement>()
	let created = $state(false)

	const setMapSize = () => {
		const canvas = map?.getCanvas()
		context.size.set({
			width: canvas?.clientWidth ?? 0,
			height: canvas?.clientHeight ?? 0,
		})
	}

	const handleCreate = () => {
		if (map === undefined) {
			return
		}

		created = true
		onCreate?.(map)

		// Resize the map after any slots have been rendered.
		void tick().then(() => map?.resize())
	}

	const handleMove = () => {
		if (map === undefined) {
			return
		}

		context.center.set(map.getCenter())
		context.zoom.set(map.getZoom())
		onMove?.(map)
	}

	const handleResize = () => {
		if (map === undefined) {
			return
		}

		setMapSize()
		context.center.set(map.getCenter())
		context.zoom.set(map.getZoom())
		onResize?.(map)
	}

	const updateStyle = async (provider: MapProvider, apiKey?: string) => {
		const style = await getStyleSpecification(provider, apiKey)
		map?.setStyle(style)
	}

	$effect(() => {
		map?.setMinPitch(minPitch)
	})

	$effect(() => {
		map?.setMaxPitch(maxPitch)
	})

	$effect(() => {
		map?.setZoom(zoom)
	})

	$effect(() => {
		map?.setCenter(center)
	})

	$effect(() => {
		void updateStyle(mapProvider, mapProviderKey)
	})

	onMount(() => {
		if (container === undefined) {
			return
		}

		map = new Map({
			container,
			center,
			zoom,
			minPitch,
			maxPitch,
			minZoom,
			maxZoom,
			...options,
		})

		context.map.set(map)

		map.on('move', handleMove)
		map.on('resize', handleResize)
		map.on('style.load', handleCreate)

		void updateStyle(mapProvider, mapProviderKey)

		return () => {
			map?.off('move', handleMove)
			map?.off('resize', handleResize)
			map?.off('style.load', handleCreate)
		}
	})
</script>

{#if created}
	{@render children?.()}
{/if}

<div
	class={['h-full', className]}
	{...rest}
>
	<div
		class="h-full"
		bind:this={container}
	></div>

	{#if created}
		{@render layer?.()}
	{/if}
</div>
