import type { Location } from '@viamrobotics/sdk'

/** A saved navigation location that has a GPS position, in the shape the map and legend draw. */
export interface GeoWaypoint {
	id: string
	location: {
		latitude: number
		longitude: number
	}
}

/** Returns nothing for a location on a local map, which this GPS map cannot place. */
export const toGeoWaypoint = (location: Location): GeoWaypoint | undefined => {
	const position = location.position?.value

	if (position?.case !== 'geoPose' || !position.value.location) {
		return undefined
	}

	return { id: location.name, location: position.value.location }
}
