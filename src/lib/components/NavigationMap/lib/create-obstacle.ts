import { theme } from '@viamrobotics/prime-core/theme'
import { LngLat } from 'maplibre-gl'

import type { Obstacle, Shapes } from '../types'

import { createGeometry } from './create-geometry'

export const createObstacle = (name: string, lngLat: LngLat, type: Shapes = 'box'): Obstacle => {
	return {
		name,
		location: new LngLat(lngLat.lng, lngLat.lat),
		geometries: [createGeometry(type)],
		label: 'static',
		color: theme.extend.colors.cyberpunk,
	}
}
