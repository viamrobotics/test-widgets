import type { LngLat } from 'maplibre-gl'

/** Client-side pose for a navigation-map geometry. Rotation only; never serialized. */
export interface GeometryPose {
	/** Orientation vector; only the theta rotation (radians) is used on the map. */
	orientationVector: { th: number }
}

interface BaseGeometry {
	pose: GeometryPose
}

export const NavigationTab = {
	Waypoints: 'Waypoints',
	Obstacles: 'Obstacles',
	Attributes: 'Attributes',
} as const

export type NavigationTabType = (typeof NavigationTab)[keyof typeof NavigationTab]

export type Shapes = 'box' | 'sphere' | 'capsule'

export type CapsuleGeometry = BaseGeometry & {
	type: 'capsule'
	radius: number
	length: number
}

export type SphereGeometry = BaseGeometry & {
	type: 'sphere'
	radius: number
}

export type BoxGeometry = BaseGeometry & {
	type: 'box'
	length: number
	width: number
	height: number
}

export type Geometry = BoxGeometry | SphereGeometry | CapsuleGeometry

export interface Obstacle {
	name: string
	location: LngLat
	geometries: Geometry[]
	color: string
	label: string
}

export type Path = LngLat[]
