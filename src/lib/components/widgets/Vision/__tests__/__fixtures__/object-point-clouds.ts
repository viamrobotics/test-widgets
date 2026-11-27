import {
	GeometriesInFrame,
	Geometry,
	PointCloudObject,
	Pose,
	RectangularPrism,
	Sphere,
	Vector3,
} from '@viamrobotics/sdk'

const encodePcd = (points: [number, number, number][]): Uint8Array => {
	const header = [
		'# .PCD v0.7 - Point Cloud Data file format',
		'VERSION 0.7',
		'FIELDS x y z',
		'SIZE 4 4 4',
		'TYPE F F F',
		'COUNT 1 1 1',
		`WIDTH ${points.length}`,
		'HEIGHT 1',
		'VIEWPOINT 0 0 0 1 0 0 0',
		`POINTS ${points.length}`,
		'DATA ascii',
	]
	const body = points.map((point) => point.join(' '))
	return new TextEncoder().encode([...header, ...body].join('\n') + '\n')
}

export const objectWithBoxAndSphere = new PointCloudObject({
	pointCloud: encodePcd([
		[0, 0, 0],
		[1, 0, 0],
		[0, 1, 0],
		[0, 0, 1],
	]),
	geometries: new GeometriesInFrame({
		referenceFrame: 'world',
		geometries: [
			new Geometry({
				label: 'crate',
				center: new Pose({ x: 250.5, y: 10, z: 20, theta: 45 }),
				geometryType: {
					case: 'box',
					value: new RectangularPrism({ dimsMm: new Vector3({ x: 1200, y: 800, z: 600 }) }),
				},
			}),
			new Geometry({
				label: 'ball',
				geometryType: { case: 'sphere', value: new Sphere({ radiusMm: 40 }) },
			}),
		],
	}),
})

export const objectWithMissingValues = new PointCloudObject({
	pointCloud: encodePcd([
		[0, 0, 0],
		[2, 0, 0],
		[0, 2, 0],
	]),
	geometries: new GeometriesInFrame({
		referenceFrame: 'base',
		geometries: [
			new Geometry({
				label: 'bare',
				geometryType: { case: 'box', value: new RectangularPrism() },
			}),
		],
	}),
})
