import { Quaternion, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

import { VIEW_ROTATION } from '../gizmo-geometry'
import {
	axisArcRotation,
	keyboardRotation,
	rollRotation,
	trackballRotation,
} from '../gizmo-rotation'

const axisAngle = (x: number, y: number, z: number, angle: number) =>
	new Quaternion().setFromAxisAngle(new Vector3(x, y, z).normalize(), angle)

const inViewSpace = (worldRotation: Quaternion) =>
	VIEW_ROTATION.clone().multiply(worldRotation).multiply(VIEW_ROTATION.clone().invert())

const expectQuaternionClose = (actual: Quaternion, expected: Quaternion, message?: string) => {
	// q and -q are the same rotation, so align signs first.
	const sign = actual.dot(expected) < 0 ? -1 : 1
	expect(sign * actual.x, message).toBeCloseTo(expected.x, 6)
	expect(sign * actual.y, message).toBeCloseTo(expected.y, 6)
	expect(sign * actual.z, message).toBeCloseTo(expected.z, 6)
	expect(sign * actual.w, message).toBeCloseTo(expected.w, 6)
}

describe('gizmo rotation', () => {
	it('turns a 68 px horizontal drag into one radian about view y', () => {
		const result = trackballRotation(new Quaternion(), 68, 0)
		expectQuaternionClose(inViewSpace(result), axisAngle(0, 1, 0, 1))
	})

	it('returns a copy of the start for a zero drag', () => {
		const start = axisAngle(1, 2, 3, 0.7)
		const result = trackballRotation(start, 0, 0)
		expect(result).not.toBe(start)
		expectQuaternionClose(result, start)
	})

	it('reverses the arc angle because world x faces the camera', () => {
		const result = axisArcRotation(new Quaternion(), 'x', 0.5)
		expectQuaternionClose(
			result,
			axisAngle(1, 0, 0, -0.5),
			'view z of world x is 1/sqrt(3) > 0, so line 828 negates the angle'
		)
	})

	it('rolls about view z by the negated angle', () => {
		const result = rollRotation(new Quaternion(), 0.3)
		expectQuaternionClose(inViewSpace(result), axisAngle(0, 0, 1, -0.3))
	})

	it('keeps a unit quaternion at the Shift step size', () => {
		const result = keyboardRotation(new Quaternion(), 10, 0)
		expect(result.length()).toBeCloseTo(1, 12)
		expect(2 * Math.acos(Math.abs(result.w))).toBeCloseTo((10 * Math.PI) / 16, 6)
	})

	it('does not mutate its input quaternion', () => {
		const start = axisAngle(1, 2, 3, 0.7)
		const snapshot = start.clone()
		trackballRotation(start, 20, 10)
		axisArcRotation(start, 'y', 0.4)
		rollRotation(start, 0.4)
		keyboardRotation(start, 1, -1)
		expect(start.equals(snapshot)).toBe(true)
	})
})
