import type { Pose } from '@viamrobotics/sdk'

import { MathUtils, Quaternion, Vector3 } from 'three'

/** The orientation half of a pose. theta is in degrees, as on the wire. */
export type OrientationVector = Pick<Pose, 'oX' | 'oY' | 'oZ' | 'theta'>

const POLE_RADIUS = 0.0001

const RDK_NEGATIVE_X_AXIS = new Quaternion(-1, 0, 0, 0)
const RDK_Z_AXIS = new Quaternion(0, 0, 1, 0)

const conjugate = new Quaternion()
const transformedX = new Quaternion()
const transformedZ = new Quaternion()
const testRotation = new Quaternion()
const testRotationConjugate = new Quaternion()
const transformedXImaginary = new Vector3()
const transformedZImaginary = new Vector3()
const globalZImaginary = new Vector3(0, 0, 1)
const normalLocalPlane = new Vector3()
const normalGlobalPlane = new Vector3()
const normalTestPlane = new Vector3()
const testZImaginary = new Vector3()
const unitAxis = new Vector3()

/**
 * Writes the rotation an orientation vector describes into `dest` and returns `dest`. Ports rdk's
 * `OrientationVector.Quaternion()`: the direction is normalized first, and a direction within 1e-4
 * of a pole is treated as on the pole.
 */
export const orientationVectorToQuaternion = (
	orientation: OrientationVector,
	dest: Quaternion
): Quaternion => {
	const direction = unitAxis.set(orientation.oX, orientation.oY, orientation.oZ)
	if (direction.lengthSq() === 0) {
		direction.set(0, 0, 1)
	} else {
		direction.normalize()
	}

	const latitude = Math.acos(MathUtils.clamp(direction.z, -1, 1))
	const longitude =
		1 - Math.abs(direction.z) > POLE_RADIUS ? Math.atan2(direction.y, direction.x) : 0
	const theta = MathUtils.degToRad(orientation.theta)

	const sinLongitude = Math.sin(longitude / 2)
	const cosLongitude = Math.cos(longitude / 2)
	const sinLatitude = Math.sin(latitude / 2)
	const cosLatitude = Math.cos(latitude / 2)
	const sinTheta = Math.sin(theta / 2)
	const cosTheta = Math.cos(theta / 2)

	return dest.set(
		cosLongitude * sinLatitude * sinTheta - sinLongitude * sinLatitude * cosTheta,
		cosLongitude * sinLatitude * cosTheta + sinLongitude * sinLatitude * sinTheta,
		sinLongitude * cosLatitude * cosTheta + cosLongitude * cosLatitude * sinTheta,
		cosLongitude * cosLatitude * cosTheta - sinLongitude * cosLatitude * sinTheta
	)
}

/** The orientation vector of a unit quaternion, theta in degrees. Ports rdk's `QuatToOV`. */
export const quaternionToOrientationVector = (quaternion: Quaternion): OrientationVector => {
	conjugate.copy(quaternion).conjugate()
	transformedX.multiplyQuaternions(quaternion, RDK_NEGATIVE_X_AXIS).multiply(conjugate)
	transformedZ.multiplyQuaternions(quaternion, RDK_Z_AXIS).multiply(conjugate)

	let theta = 0

	if (1 - Math.abs(transformedZ.z) > POLE_RADIUS) {
		transformedZImaginary.set(transformedZ.x, transformedZ.y, transformedZ.z)
		transformedXImaginary.set(transformedX.x, transformedX.y, transformedX.z)

		normalLocalPlane.copy(transformedZImaginary).cross(transformedXImaginary)
		normalGlobalPlane.copy(transformedZImaginary).cross(globalZImaginary)

		const cosThetaCandidate =
			normalLocalPlane.dot(normalGlobalPlane) /
			(normalLocalPlane.length() * normalGlobalPlane.length())
		const angle = Math.acos(MathUtils.clamp(cosThetaCandidate, -1, 1))

		if (angle > POLE_RADIUS) {
			unitAxis.copy(transformedZImaginary).normalize()
			testRotation.setFromAxisAngle(unitAxis, -angle)
			testRotationConjugate.copy(testRotation).conjugate()
			const testZ = testRotation.multiplyQuaternions(
				testRotation.multiply(RDK_Z_AXIS),
				testRotationConjugate
			)
			testZImaginary.set(testZ.x, testZ.y, testZ.z)
			normalTestPlane.copy(transformedZImaginary).cross(testZImaginary)
			const cosTest =
				normalLocalPlane.dot(normalTestPlane) /
				(normalLocalPlane.length() * normalTestPlane.length())
			theta = 1 - cosTest < POLE_RADIUS ** 2 ? -angle : angle
		}
	} else if (transformedZ.z < 0) {
		theta = -Math.atan2(transformedX.y, transformedX.x)
	} else {
		theta = -Math.atan2(transformedX.y, -transformedX.x)
	}

	return {
		oX: transformedZ.x,
		oY: transformedZ.y,
		oZ: transformedZ.z,
		// rdk quirk: -0 would print as "-0" in a field.
		theta: theta === 0 ? 0 : MathUtils.radToDeg(theta),
	}
}
