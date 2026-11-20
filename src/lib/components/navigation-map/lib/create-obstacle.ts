import { themeColor } from '@viamrobotics/tailwind-config/theme-color'
import { LngLat } from 'maplibre-gl'

import type { Obstacle, Shapes } from '../types'

import { createGeometry } from './create-geometry'

export const createObstacle = (name: string, lngLat: LngLat, type: Shapes = 'box'): Obstacle => {
	return {
		name,
		location: new LngLat(lngLat.lng, lngLat.lat),
		geometries: [createGeometry(type)],
		label: 'static',
		color: themeColor('--color-cyberpunk-bright') ?? '',
	}
}
