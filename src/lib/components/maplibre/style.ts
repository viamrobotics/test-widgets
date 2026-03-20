import type { StyleSpecification } from 'maplibre-gl';

import { registerGoogleMapsProtocol } from './plugins/google-maps';
import { type MapProvider, MapProviders } from './types';
import { DEFAULT_MAX_ZOOM } from './zoom';

const tileSize = 256;

export const getGoogleMapsStyle = (
	apiKey: string,
	maxzoom: number,
	mapType: 'roadmap' | 'satellite' = 'roadmap'
): StyleSpecification => {
	const style: StyleSpecification = {
		version: 8,
		sources: {
			google: {
				type: 'raster',
				tiles: [`google://${mapType}/{z}/{x}/{y}?key=${apiKey}`],
				tileSize,
				attribution: '&copy; Google Maps',
				maxzoom
			}
		},
		layers: [
			{
				id: 'google',
				type: 'raster',
				source: 'google'
			}
		]
	};

	return style;
};

const getOpenStreetMapStyle = (maxzoom: number): StyleSpecification => ({
	version: 8,
	sources: {
		osm: {
			type: 'raster',
			tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
			tileSize,
			attribution: '&copy; OpenStreetMap Contributors',
			maxzoom
		},
		satellite: {
			type: 'raster',
			tiles: [
				'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}'
			],
			tileSize,
			attribution: '&copy; USGS National Map Services',
			maxzoom
		}
	},
	layers: [
		{
			id: 'osm',
			type: 'raster',
			source: 'osm'
		},
		{
			id: 'satellite',
			type: 'raster',
			source: 'satellite',
			layout: {
				visibility: 'none'
			}
		}
	]
});

export const getStyleSpecification = async (
	provider: MapProvider,
	apiKey?: string,
	maxZoom = DEFAULT_MAX_ZOOM,
	satelliteMode = false
): Promise<StyleSpecification> => {
	switch (provider) {
		case MapProviders.googleMaps: {
			if (!apiKey) {
				console.warn('Google Maps API key is required, falling back to OpenStreetMap');
				return getOpenStreetMapStyle(maxZoom);
			}

			try {
				const success = await registerGoogleMapsProtocol(apiKey);
				if (!success) {
					console.warn('Google Maps protocol registration failed, falling back to OpenStreetMap');
					return getOpenStreetMapStyle(maxZoom);
				}

				const mapType = satelliteMode ? 'satellite' : 'roadmap';
				return getGoogleMapsStyle(apiKey, maxZoom, mapType);
			} catch (error) {
				console.error('Failed to create Google Maps style, falling back to OpenStreetMap:', error);
				return getOpenStreetMapStyle(maxZoom);
			}
		}

		case MapProviders.openStreet: {
			return getOpenStreetMapStyle(maxZoom);
		}
	}
};
