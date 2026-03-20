import type { GeoGeometry } from '@viamrobotics/sdk';

export const obstacles: GeoGeometry[] = [
	{
		location: { latitude: 1, longitude: 2 },
		geometries: [
			{
				center: { x: 0, y: 0, z: 0, oX: 0, oY: 0, oZ: 1, theta: 0 },
				geometryType: {
					case: 'sphere',
					value: {
						radiusMm: 2000
					}
				},
				label: 'sphere'
			}
		]
	},
	{
		location: { latitude: 3, longitude: 4 },
		geometries: [
			{
				center: { x: 0, y: 0, z: 0, oX: 0, oY: 0, oZ: 1, theta: 0 },
				geometryType: {
					case: 'capsule',
					value: { radiusMm: 500, lengthMm: 5000 }
				},
				label: 'capsule'
			}
		]
	},
	{
		location: { latitude: 5, longitude: 6 },
		geometries: [
			{
				center: { x: 0, y: 0, z: 0, oX: 0, oY: 0, oZ: 1, theta: 0 },
				geometryType: {
					case: 'box',
					value: { dimsMm: { x: 50_000, y: 50_000, z: 50_000 } }
				},
				label: 'box'
			}
		]
	},
	{
		location: { latitude: 7, longitude: 8 },
		geometries: [
			{
				center: { x: 0, y: 0, z: 0, oX: 0, oY: 0, oZ: 1, theta: 0 },
				geometryType: {
					case: 'capsule',
					value: { radiusMm: 50_000, lengthMm: 300_000 }
				},
				label: 'myCamera_transientObstacle'
			}
		]
	}
];
