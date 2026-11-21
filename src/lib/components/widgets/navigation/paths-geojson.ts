interface LineFeature {
	type: 'Feature'
	properties: Record<string, never>
	geometry: { type: 'LineString'; coordinates: number[][] }
}

interface LineCollection {
	type: 'FeatureCollection'
	features: LineFeature[]
}

interface PathPoints {
	geopoints: { latitude: number; longitude: number }[]
}

/** One line per path, in [longitude, latitude] order. A path with fewer than two points draws nothing. */
export const pathsToGeoJson = (paths: PathPoints[]): LineCollection => {
	const features = paths.flatMap((path): LineFeature[] => {
		if (path.geopoints.length < 2) return []
		return [
			{
				type: 'Feature',
				properties: {},
				geometry: {
					type: 'LineString',
					coordinates: path.geopoints.map((point) => [point.longitude, point.latitude]),
				},
			},
		]
	})

	return { type: 'FeatureCollection', features }
}
