import { Quaternion, Vector3 } from 'three'

import { type GizmoAxis, VIEW_ROTATION } from './gizmo-geometry'

const PIXELS_PER_RADIAN = 68
const KEY_STEP_RADIANS = Math.PI / 16

const AXIS_VECTORS: Record<GizmoAxis, Vector3> = {
	x: new Vector3(1, 0, 0),
	y: new Vector3(0, 1, 0),
	z: new Vector3(0, 0, 1),
}

const VIEW_Z = new Vector3(0, 0, 1)

/**
 * Applies `viewRotation`, a rotation expressed in view space, to `start` in world space:
 * `V⁻¹ · S · V · R`. Returns a new normalized quaternion.
 */
const applyViewSpaceRotation = (start: Quaternion, viewRotation: Quaternion): Quaternion =>
	VIEW_ROTATION.clone()
		.invert()
		.multiply(viewRotation)
		.multiply(VIEW_ROTATION)
		.multiply(start)
		.normalize()

const viewSpaceTurn = (axisX: number, axisY: number, angle: number): Quaternion => {
	const axis = new Vector3(axisX, axisY, 0)
	if (axis.lengthSq() === 0) return new Quaternion()
	return new Quaternion().setFromAxisAngle(axis.normalize(), angle)
}

/**
 * The rotation after a free drag of `dx`, `dy` px from `start`, a trackball in screen space: the
 * axis is `(dy, dx, 0)` and the angle `length / 68` radians. Returns a new unit quaternion.
 * Ported from `@kitschpatrol/tweakpane-plugin-rotation` by 0b5vr, MIT, see
 * `rotation-gizmo.LICENSE.txt`.
 */
export const trackballRotation = (start: Quaternion, dx: number, dy: number): Quaternion =>
	applyViewSpaceRotation(start, viewSpaceTurn(dy, dx, Math.hypot(dx, dy) / PIXELS_PER_RADIAN))

/**
 * The rotation after turning `deltaAngle` radians about the object's own `axis` from `start`, for
 * a drag on that axis's ring. The sign flips when the axis faces the camera. Returns a new unit
 * quaternion.
 */
export const axisArcRotation = (
	start: Quaternion,
	axis: GizmoAxis,
	deltaAngle: number
): Quaternion => {
	const localAxis = AXIS_VECTORS[axis]
	const axisInView = localAxis.clone().applyQuaternion(start).applyQuaternion(VIEW_ROTATION)
	const signedAngle = axisInView.z > 0 ? -deltaAngle : deltaAngle
	return start
		.clone()
		.multiply(new Quaternion().setFromAxisAngle(localAxis, signedAngle))
		.normalize()
}

/** The rotation after rolling `deltaAngle` radians about the view axis, for the roll ring drag. */
export const rollRotation = (start: Quaternion, deltaAngle: number): Quaternion =>
	applyViewSpaceRotation(start, new Quaternion().setFromAxisAngle(VIEW_Z, -deltaAngle))

/**
 * The rotation after one arrow key press, in screen space. `stepX` and `stepY` are ±1, ±10 with
 * Shift, or ±0.1 with Alt. The angle is π/16 times the step's length about a normalized axis, so
 * the result is always a unit quaternion.
 */
export const keyboardRotation = (current: Quaternion, stepX: number, stepY: number): Quaternion =>
	applyViewSpaceRotation(
		current,
		viewSpaceTurn(-stepY, stepX, KEY_STEP_RADIANS * Math.hypot(stepX, stepY))
	)
