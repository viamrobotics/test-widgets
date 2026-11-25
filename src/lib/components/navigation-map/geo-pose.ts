import { LngLat } from 'maplibre-gl'

/** A longitude and latitude with a heading, clockwise in degrees. */
export class GeoPose extends LngLat {
	rotation: number
	constructor(lng: number, lat: number, rotation: number) {
		super(lng, lat)
		this.rotation = rotation
	}
}
