import { LngLat } from 'maplibre-gl'

/** A longitude and latitude with the id of the navigation waypoint it marks. */
export class Waypoint extends LngLat {
	id: string
	constructor(lng: number, lat: number, id: string) {
		super(lng, lat)
		this.id = id
	}
}
