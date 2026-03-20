import { getContext, onDestroy, setContext } from 'svelte';
import { get, type Writable, writable } from 'svelte/store';
import type {
	LngLat,
	Map,
	MapLayerEventType,
	MapLayerMouseEvent,
	MapLayerTouchEvent
} from 'maplibre-gl';

import { type MapProvider, MapProviders } from './types';

const mapContextKey = Symbol('viam-maplibre');

interface MapContext {
	map: Writable<Map>;
	center: Writable<LngLat>;
	size: Writable<{ width: number; height: number }>;
	zoom: Writable<number>;
	maxZoom: Writable<number>;
	mapProvider: Writable<MapProvider>;
	apiKey: Writable<string | undefined>;
	satellite: Writable<boolean>;
}

export const provideMapContext = (
	center: LngLat,
	zoom: number,
	maxZoom: number,
	mapProvider: MapProvider = MapProviders.openStreet,
	apiKey: string | undefined = undefined,
	satellite = false
) => {
	const context: MapContext = {
		map: writable<Map>(),
		center: writable(center),
		size: writable({ width: 0, height: 0 }),
		zoom: writable(zoom),
		maxZoom: writable(maxZoom),
		mapProvider: writable(mapProvider),
		apiKey: writable(apiKey),
		satellite: writable(satellite)
	};

	setContext<MapContext>(mapContextKey, context);

	return context;
};

/**
 * Provides context for a <MapLibre> instance. Must be called within a child of this component.
 */
export const useMapLibre = () => {
	const context = getContext<MapContext | undefined>(mapContextKey);

	if (!context) {
		throw new Error(
			'useMapLibre is a context sensitive hook that must be used inside a <MapLibre> component.'
		);
	}

	return {
		map: get(context.map),
		mapCenter: context.center,
		mapSize: context.size,
		mapZoom: context.zoom,
		maxZoom: context.maxZoom,
		mapProvider: context.mapProvider,
		apiKey: context.apiKey,
		satellite: context.satellite
	};
};

/**
 * Allows attaching events to a <MapLibre> instance. Must be called within a child of this component.
 */
export const useMapLibreEvent = (
	event: keyof MapLayerEventType | 'move' | 'resize',
	listener: (ev: MapLayerMouseEvent | MapLayerTouchEvent) => void
) => {
	const { map } = useMapLibre();

	map.on(event, listener);

	onDestroy(() => map.off(event, listener));
};
