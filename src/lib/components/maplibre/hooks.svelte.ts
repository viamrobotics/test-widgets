import type {
	LngLat,
	Map,
	MapLayerEventType,
	MapLayerMouseEvent,
	MapLayerTouchEvent,
} from 'maplibre-gl'

import { getContext, setContext } from 'svelte'
import { fromStore, type Writable, writable } from 'svelte/store'

import { type MapProvider, MapProviders } from './types'

const mapContextKey = Symbol('viam-maplibre')

interface MapContext {
	map: Writable<Map>
	center: Writable<LngLat>
	size: Writable<{ width: number; height: number }>
	zoom: Writable<number>
	maxZoom: Writable<number>
	mapProvider: Writable<MapProvider>
	apiKey: Writable<string | undefined>
	satellite: Writable<boolean>
}

export const provideMapContext = (
	options: () => {
		center: LngLat
		zoom: number
		maxZoom: number
		mapProvider?: MapProvider
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

	$effect(() => {
		context.center.set(center)
	})
	$effect(() => {
		context.zoom.set(zoom)
	})
	$effect(() => {
		context.maxZoom.set(maxZoom)
	})
	$effect(() => {
		context.mapProvider.set(mapProvider)
	})
	$effect(() => {
		context.apiKey.set(apiKey)
	})
	$effect(() => {
		context.satellite.set(satellite)
	})

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
	const context = useMapLibre()

	const map = fromStore(context.map)

	$effect(() => {
		map.current.on(event, listener)
		return () => {
			map.current.off(event, listener)
		}
	})
}
