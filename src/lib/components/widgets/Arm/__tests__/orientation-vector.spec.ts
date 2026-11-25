import { describe, expect, it } from 'vitest'

import {
	type OrientationVectorDegrees,
	orientationVectorToQuaternion,
	orientationVectorToRollPitchYaw,
	quaternionToOrientationVector,
} from '../orientation-vector'

const DIGITS = 5

const roundTrip = (orientation: OrientationVectorDegrees): OrientationVectorDegrees =>
	quaternionToOrientationVector(orientationVectorToQuaternion(orientation))

const expectRoundTrip = (orientation: OrientationVectorDegrees) => {
	const result = roundTrip(orientation)
	expect(result.oX).toBeCloseTo(orientation.oX, DIGITS)
	expect(result.oY).toBeCloseTo(orientation.oY, DIGITS)
	expect(result.oZ).toBeCloseTo(orientation.oZ, DIGITS)
	expect(result.theta).toBeCloseTo(orientation.theta, DIGITS)
}

describe('orientation vector and quaternion', () => {
	it('round trips an off-axis orientation', () => {
		const axis = Math.hypot(1, 2, 2)
		expectRoundTrip({ oX: 1 / axis, oY: 2 / axis, oZ: 2 / axis, theta: 40 })
	})

	it('round trips an axis along +Z with nonzero theta', () => {
		expectRoundTrip({ oX: 0, oY: 0, oZ: 1, theta: 30 })
		expectRoundTrip({ oX: 0, oY: 0, oZ: 1, theta: -45 })
	})

	it('round trips an axis along -Z with nonzero theta', () => {
		expectRoundTrip({ oX: 0, oY: 0, oZ: -1, theta: 30 })
		expectRoundTrip({ oX: 0, oY: 0, oZ: -1, theta: -60 })
	})

	it('reads a zero axis as the identity', () => {
		const quaternion = orientationVectorToQuaternion({ oX: 0, oY: 0, oZ: 0, theta: 0 })
		expect(quaternion.w).toBeCloseTo(1, DIGITS)
	})
})

describe('orientationVectorToRollPitchYaw', () => {
	it('is all zero for the identity orientation', () => {
		const { roll, pitch, yaw } = orientationVectorToRollPitchYaw({
			oX: 0,
			oY: 0,
			oZ: 1,
			theta: 0,
		})
		expect(roll).toBeCloseTo(0, DIGITS)
		expect(pitch).toBeCloseTo(0, DIGITS)
		expect(yaw).toBeCloseTo(0, DIGITS)
	})

	it('reads theta about +Z as yaw', () => {
		const { roll, pitch, yaw } = orientationVectorToRollPitchYaw({
			oX: 0,
			oY: 0,
			oZ: 1,
			theta: 90,
		})
		expect(roll).toBeCloseTo(0, DIGITS)
		expect(pitch).toBeCloseTo(0, DIGITS)
		expect(yaw).toBeCloseTo(90, DIGITS)
	})

	it('reads an axis tilted toward +X as pitch', () => {
		const tilt = (30 * Math.PI) / 180
		const { roll, pitch, yaw } = orientationVectorToRollPitchYaw({
			oX: Math.sin(tilt),
			oY: 0,
			oZ: Math.cos(tilt),
			theta: 0,
		})
		expect(roll).toBeCloseTo(0, DIGITS)
		expect(pitch).toBeCloseTo(30, DIGITS)
		expect(yaw).toBeCloseTo(0, DIGITS)
	})
})
