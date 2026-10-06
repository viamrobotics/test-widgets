import { Euler, MathUtils, Quaternion } from 'three'

import {
	type OrientationVector,
	orientationVectorToQuaternion,
	quaternionToOrientationVector,
} from '$lib/orientation-vector-quaternion'

/** Viam's Euler angles in degrees: roll about X, pitch about Y, yaw about Z, applied as extrinsic XYZ. */
export interface EulerDegrees {
	roll: number
	pitch: number
	yaw: number
}

const GIMBAL_LOCK_TOLERANCE_DEGREES = 0.05
const RIGHT_ANGLE_DEGREES = 90

const scratchQuaternion = new Quaternion()
const scratchEuler = new Euler()

/** The Euler angles of an orientation vector, through a quaternion and three.js `'ZYX'` order. */
export const orientationVectorToEuler = (orientation: OrientationVector): EulerDegrees => {
	orientationVectorToQuaternion(orientation, scratchQuaternion)
	scratchEuler.setFromQuaternion(scratchQuaternion, 'ZYX')

	return {
		roll: MathUtils.radToDeg(scratchEuler.x),
		pitch: MathUtils.radToDeg(scratchEuler.y),
		yaw: MathUtils.radToDeg(scratchEuler.z),
	}
}

/** The orientation vector of Euler angles, the inverse of `orientationVectorToEuler`. */
export const eulerToOrientationVector = (euler: EulerDegrees): OrientationVector => {
	scratchEuler.set(
		MathUtils.degToRad(euler.roll),
		MathUtils.degToRad(euler.pitch),
		MathUtils.degToRad(euler.yaw),
		'ZYX'
	)
	scratchQuaternion.setFromEuler(scratchEuler)

	return quaternionToOrientationVector(scratchQuaternion)
}

/**
 * Whether pitch is within 0.05° of ±90, where roll and yaw turn about the same axis. At 0.1° field
 * precision, this is exactly when the Pitch field reads `90.0`.
 */
export const isEulerGimbalLocked = (euler: EulerDegrees): boolean =>
	RIGHT_ANGLE_DEGREES - Math.abs(euler.pitch) < GIMBAL_LOCK_TOLERANCE_DEGREES
