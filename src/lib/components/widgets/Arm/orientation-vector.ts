import { Euler, MathUtils, Quaternion, Vector3 } from 'three'

/** A Viam orientation vector: a unit axis the end effector points along, and the rotation about it. */
export interface OrientationVectorDegrees {
	oX: number
	oY: number
	oZ: number
	/** Rotation about the axis, in degrees. */
	theta: number
}

/** Intrinsic Rz(yaw)·Ry(pitch)·Rx(roll), in degrees. */
export interface RollPitchYawDegrees {
	roll: number
	pitch: number
	yaw: number
}

/** Within this distance of ±Z, rdk measures theta as if the longitude were zero. */
const POLE_EPSILON = 0.0001
const HALF = 0.5
const FULL_TURN = 2 * Math.PI

const xAxisQuaternion = new Quaternion(-1, 0, 0, 0)
const zAxisQuaternion = new Quaternion(0, 0, 1, 0)
const zAxisVector = new Vector3(0, 0, 1)

/** Scales to unit length. A zero vector reads as unset and becomes +Z, as in rdk. */
const normalizeAxis = (x: number, y: number, z: number): Vector3 => {
	const axis = new Vector3(x, y, z)
	if (axis.lengthSq() === 0) {
		return axis.set(0, 0, 1)
	}
	return axis.normalize()
}

const isInPoleRadius = (x: number, y: number, z: number): boolean =>
	1 - Math.abs(z / Math.hypot(x, y, z)) <= POLE_EPSILON

/** Go's `math.Remainder`: the signed remainder whose magnitude is at most half the divisor. */
const remainder = (dividend: number, divisor: number): number =>
	dividend - divisor * Math.round(dividend / divisor)

/**
 * Decodes the orientation as Rz(longitude)·Ry(latitude)·Rz(theta) like rdk. An axis parallel to Z has no
 * longitude, so theta is shifted to keep its meaning. A zero axis reads as +Z.
 */
export function orientationVectorToQuaternion(orientation: OrientationVectorDegrees): Quaternion {
	const axis = normalizeAxis(orientation.oX, orientation.oY, orientation.oZ)
	const latitude = Math.acos(MathUtils.clamp(axis.z, -1, 1))
	const longitude = Math.atan2(axis.y, axis.x)

	let theta = MathUtils.degToRad(orientation.theta)
	if (isInPoleRadius(axis.x, axis.y, axis.z)) {
		theta += axis.z > 0 ? -longitude : longitude
	}

	const sinHalfLongitude = Math.sin(longitude * HALF)
	const cosHalfLongitude = Math.cos(longitude * HALF)
	const sinHalfLatitude = Math.sin(latitude * HALF)
	const cosHalfLatitude = Math.cos(latitude * HALF)
	const sinHalfTheta = Math.sin(theta * HALF)
	const cosHalfTheta = Math.cos(theta * HALF)

	return new Quaternion(
		cosHalfLongitude * sinHalfLatitude * sinHalfTheta -
			sinHalfLongitude * sinHalfLatitude * cosHalfTheta,
		cosHalfLongitude * sinHalfLatitude * cosHalfTheta +
			sinHalfLongitude * sinHalfLatitude * sinHalfTheta,
		sinHalfLongitude * cosHalfLatitude * cosHalfTheta +
			cosHalfLongitude * cosHalfLatitude * sinHalfTheta,
		cosHalfLongitude * cosHalfLatitude * cosHalfTheta -
			sinHalfLongitude * cosHalfLatitude * sinHalfTheta
	)
}

/** Theta in radians when the encoded axis is within the pole radius of ±Z. */
const poleTheta = (quaternion: Quaternion, newX: Quaternion, newZ: Quaternion): number => {
	const poleEstimate = newZ.z < 0 ? -Math.atan2(newX.y, newX.x) : -Math.atan2(newX.y, -newX.x)

	// Exact only on the pole. Off it, solve q = Rz(longitude)·Ry(latitude)·Rz(theta -/+ longitude).
	const longitude = Math.atan2(newZ.y, newZ.x)
	const latitude = Math.acos(MathUtils.clamp(newZ.z, -1, 1))
	const longitudeQuaternion = new Quaternion(
		0,
		0,
		Math.sin(longitude * HALF),
		Math.cos(longitude * HALF)
	)
	const latitudeQuaternion = new Quaternion(
		0,
		Math.sin(latitude * HALF),
		0,
		Math.cos(latitude * HALF)
	)
	const twist = longitudeQuaternion.multiply(latitudeQuaternion).conjugate().multiply(quaternion)
	const twistTheta = 2 * Math.atan2(twist.z, twist.w) + (newZ.z > 0 ? longitude : -longitude)
	return poleEstimate + remainder(twistTheta - poleEstimate, FULL_TURN)
}

/** Theta in radians when the encoded axis is away from ±Z. */
const offPoleTheta = (newX: Quaternion, newZ: Quaternion): number => {
	const zImaginary = new Vector3(newZ.x, newZ.y, newZ.z)
	const xImaginary = new Vector3(newX.x, newX.y, newX.z)

	const xzPlaneNormal = zImaginary.clone().cross(xImaginary)
	const worldZPlaneNormal = zImaginary.clone().cross(zAxisVector)

	const cosCandidate =
		xzPlaneNormal.dot(worldZPlaneNormal) / (xzPlaneNormal.length() * worldZPlaneNormal.length())
	const angle = Math.acos(MathUtils.clamp(cosCandidate, -1, 1))
	if (angle <= POLE_EPSILON) {
		return 0
	}

	const rotation = new Quaternion().setFromAxisAngle(zImaginary.clone().normalize(), -angle)
	const rotationConjugate = rotation.clone().conjugate()
	const testZ = rotation.clone().multiply(zAxisQuaternion).multiply(rotationConjugate)
	const rotatedZPlaneNormal = zImaginary.clone().cross(new Vector3(testZ.x, testZ.y, testZ.z))
	const cosTest =
		xzPlaneNormal.dot(rotatedZPlaneNormal) / (xzPlaneNormal.length() * rotatedZPlaneNormal.length())
	return 1 - cosTest < POLE_EPSILON ** 2 ? -angle : angle
}

/** Encodes a unit quaternion like rdk, including the pole case where the axis is ±Z. */
export function quaternionToOrientationVector(quaternion: Quaternion): OrientationVectorDegrees {
	const conjugate = quaternion.clone().conjugate()
	const newX = quaternion.clone().multiply(xAxisQuaternion).multiply(conjugate)
	const newZ = quaternion.clone().multiply(zAxisQuaternion).multiply(conjugate)

	const theta = isInPoleRadius(newZ.x, newZ.y, newZ.z)
		? poleTheta(quaternion, newX, newZ)
		: offPoleTheta(newX, newZ)

	return { oX: newZ.x, oY: newZ.y, oZ: newZ.z, theta: MathUtils.radToDeg(theta) }
}

/** Roll, pitch, and yaw of the orientation, as Rz(yaw)·Ry(pitch)·Rx(roll). */
export function orientationVectorToRollPitchYaw(
	orientation: OrientationVectorDegrees
): RollPitchYawDegrees {
	const euler = new Euler().setFromQuaternion(orientationVectorToQuaternion(orientation), 'ZYX')
	return {
		roll: MathUtils.radToDeg(euler.x),
		pitch: MathUtils.radToDeg(euler.y),
		yaw: MathUtils.radToDeg(euler.z),
	}
}
