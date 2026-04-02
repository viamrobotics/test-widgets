import type {
	LngLat,
	Map,
	MapLayerEventType,
	MapLayerMouseEvent,
	MapLayerTouchEvent,
} from 'maplibre-gl'

import { getContext, onDestroy, setContext } from 'svelte'

import { type MapProvider, MapProviders } from './types'

const mapContextKey = Symbol('viam-maplibre')

interface MapContext {
	map: { current: Map }
	center: { current: LngLat }
	size: { current: { width: number; height: number } }
	zoom: { current: number }
	maxZoom: { current: number }
	mapProvider: { current: MapProvider }
	apiKey: { current: string | undefined }
	satellite: { current: boolean }
}

export const provideMapContext = (
	options: () => {
		center: LngLat
		zoom: number
		maxZoom: number
		mapProvider?: MapProvider | undefined
		apiKey?: string | undefined
		satellite?: boolean
	}
) => {
	const {
		center,
		zoom,
		maxZoom,
		mapProvider = MapProviders.openStreet,
		apiKey,
		satellite = false,
	} = $derived(options())

	const context: MapContext = {
		map: writable<Map>(),
		center: writable(center),
		size: writable({ width: 0, height: 0 }),
		zoom: writable(zoom),
		maxZoom: writable(maxZoom),
		mapProvider: writable(mapProvider),
		apiKey: writable(apiKey),
		satellite: writable(satellite),
	}

	setContext<MapContext>(mapContextKey, context)

	return context
}

/**
 * Provides context for a <MapLibre> instance. Must be called within a child of this component.
 */
export const useMapLibre = (): MapContext => {
	const context = getContext<MapContext | undefined>(mapContextKey)

	if (!context) {
		throw new Error(
			'useMapLibre is a context sensitive hook that must be used inside a <MapLibre> component.'
		)
	}

	return context
}

/**
 * Allows attaching events to a <MapLibre> instance. Must be called within a child of this component.
 */
export const useMapLibreEvent = (
	event: keyof MapLayerEventType | 'move' | 'resize',
	listener: (ev: MapLayerMouseEvent | MapLayerTouchEvent) => void
) => {
	const { map } = useMapLibre()

	map.on(event, listener)

	onDestroy(() => map.off(event, listener))
}
