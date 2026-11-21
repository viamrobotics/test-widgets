import { describe, expect, it } from 'vitest'

import { pathsToGeoJson } from '../paths-geojson'

describe('pathsToGeoJson', () => {
	it('draws each path as a line in longitude, latitude order ending at its last point', () => {
		const result = pathsToGeoJson([
			{
				geopoints: [
					{ latitude: 1, longitude: 2 },
					{ latitude: 3, longitude: 4 },
					{ latitude: 5, longitude: 6 },
				],
			},
			{
				geopoints: [
					{ latitude: 7, longitude: 8 },
					{ latitude: 9, longitude: 10 },
				],
			},
		])

		expect(result.features.map((feature) => feature.geometry.coordinates)).toEqual([
			[
				[2, 1],
				[4, 3],
				[6, 5],
			],
			[
				[8, 7],
				[10, 9],
			],
		])
	})

	it('draws nothing for a path with fewer than two points', () => {
		expect(
			pathsToGeoJson([{ geopoints: [{ latitude: 1, longitude: 2 }] }, { geopoints: [] }]).features
		).toEqual([])
	})
})
