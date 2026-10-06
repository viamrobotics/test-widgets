import { Matrix4, Quaternion, Vector3 } from 'three'

/** The gizmo pad's width and height in px. The projection, the trackball, and the labels are built for it. */
export const GIZMO_SIZE = 136

export type GizmoAxis = 'x' | 'y' | 'z'

export interface ProjectedPoint {
	x: number
	y: number
	/** View-space z. Larger is nearer the viewer. */
	depth: number
}

/**
 * World to view, for a camera at direction (1, 1, 1) with up +Z: +Z draws straight up, +X toward
 * the lower left, and +Y toward the lower right.
 */
export const VIEW_ROTATION = new Quaternion()
	.setFromRotationMatrix(
		new Matrix4().lookAt(new Vector3(1, 1, 1), new Vector3(0, 0, 0), new Vector3(0, 0, 1))
	)
	.invert()

const CAMERA_DISTANCE = 5
const FIELD_OF_VIEW_DEGREES = 30
const ARC_VERTEX_COUNT = 33
const ROLL_RING_VERTEX_COUNT = 65
const ARC_RADIUS = 1
const ROLL_RING_RADIUS = 1.1
const PATH_DECIMALS = 2
const DEGENERATE_AXIS_Z = 0.9999
const HALF_SIZE = GIZMO_SIZE / 2
const FOCAL_SCALE = 1 / Math.tan((FIELD_OF_VIEW_DEGREES * Math.PI) / 360)

const IDENTITY_ROTATION = new Quaternion()
const HALF_TURN_ABOUT_Z = new Quaternion(0, 0, 1, 0)
const ORIGIN = new Vector3()
const TOWARD_VIEWER = new Vector3(0, 0, 1)
const AWAY_FROM_VIEWER = new Vector3(0, 0, -1)
const AXIS_DIRECTIONS: Record<GizmoAxis, Vector3> = {
	x: new Vector3(1, 0, 0),
	y: new Vector3(0, 1, 0),
	z: new Vector3(0, 0, 1),
}

/** Perspective projection of a point already in view space. */
const projectViewSpace = (point: Vector3): ProjectedPoint => {
	const distance = CAMERA_DISTANCE - point.z
	return {
		x: HALF_SIZE + (point.x / distance) * FOCAL_SCALE * HALF_SIZE,
		y: HALF_SIZE - (point.y / distance) * FOCAL_SCALE * HALF_SIZE,
		depth: point.z,
	}
}

/**
 * Projects a point in object space onto the pad: rotated by `rotation`, then by `view`, then a
 * perspective projection with a 30° field of view from z = 5. Ported from
 * `@kitschpatrol/tweakpane-plugin-rotation` by 0b5vr, MIT, see `rotation-gizmo.LICENSE.txt`.
 */
export const projectPoint = (
	point: Vector3,
	rotation: Quaternion,
	view: Quaternion = VIEW_ROTATION
): ProjectedPoint => projectViewSpace(point.clone().applyQuaternion(rotation).applyQuaternion(view))

const formatPath = (points: Vector3[], transform: Quaternion): string =>
	points
		.map((vertex, index) => {
			const { x, y } = projectViewSpace(vertex.clone().applyQuaternion(transform))
			const command = index === 0 ? 'M' : 'L'
			return `${command} ${x.toFixed(PATH_DECIMALS)} ${y.toFixed(PATH_DECIMALS)}`
		})
		.join(' ')

/** Vertices of a circle arc in the local xy plane, starting on +x and sweeping through +y. */
const createRingVertices = (sweep: number, vertexCount: number, radius: number): Vector3[] =>
	Array.from({ length: vertexCount }, (_, index) => {
		const angle = (sweep * index) / (vertexCount - 1)
		return new Vector3(radius * Math.cos(angle), radius * Math.sin(angle), 0)
	})

const ARC_VERTICES = createRingVertices(Math.PI, ARC_VERTEX_COUNT, ARC_RADIUS)
const ROLL_RING_VERTICES = createRingVertices(2 * Math.PI, ROLL_RING_VERTEX_COUNT, ROLL_RING_RADIUS)

/** Orients the local xy half-ring around `axis`, with its midpoint toward `facing`. */
const createArcOrientation = (axis: Vector3, facing: Vector3): Quaternion => {
	if (Math.abs(axis.z) > DEGENERATE_AXIS_Z) {
		return facing.z > 0 ? IDENTITY_ROTATION : HALF_TURN_ABOUT_Z
	}
	return new Quaternion().setFromRotationMatrix(
		new Matrix4().lookAt(ORIGIN, axis.clone().negate(), facing)
	)
}

/** SVG path data for the front or back half of the ring around `axis`, after `rotation` and `view`. */
export const arcPath = (
	axis: GizmoAxis,
	half: 'front' | 'back',
	rotation: Quaternion,
	view: Quaternion = VIEW_ROTATION
): string => {
	const viewAxis = AXIS_DIRECTIONS[axis].clone().applyQuaternion(rotation).applyQuaternion(view)
	const facing = half === 'front' ? TOWARD_VIEWER : AWAY_FROM_VIEWER
	return formatPath(ARC_VERTICES, createArcOrientation(viewAxis, facing))
}

/** SVG path data for the roll ring, a full circle of radius 1.1 facing the viewer. */
export const rollRingPath = (): string => formatPath(ROLL_RING_VERTICES, IDENTITY_ROTATION)
