import { describe, expect, it } from 'vitest'

import {
	isUnitOrientationVector,
	normalizeOrientationVector,
} from '../normalize-orientation-vector'

const pose = { x: 412.6, y: -7.25, z: 90.5, oX: 0.5, oY: 0, oZ: -1, theta: 90 }

describe('normalizeOrientationVector', () => {
	it('scales the direction to unit length', () => {
		const result = normalizeOrientationVector(pose)
		expect(result.oX).toBeCloseTo(0.447_214, 6)
		expect(result.oY).toBeCloseTo(0, 6)
		expect(result.oZ).toBeCloseTo(-0.894_427, 6)
	})

	it('turns a zero direction into (0, 0, 1)', () => {
		const result = normalizeOrientationVector({ ...pose, oX: 0, oY: 0, oZ: 0 })
		expect([result.oX, result.oY, result.oZ]).toEqual([0, 0, 1])
	})

	it('leaves position and theta unchanged', () => {
		const result = normalizeOrientationVector(pose)
		expect([result.x, result.y, result.z, result.theta]).toEqual([412.6, -7.25, 90.5, 90])
	})

	it('does not mutate the input', () => {
		normalizeOrientationVector(pose)
		expect(pose.oX).toBe(0.5)
	})
})

describe('isUnitOrientationVector', () => {
	it.each([
		{ length: 1.0009, expected: true },
		{ length: 0.9991, expected: true },
		{ length: 1.0011, expected: false },
		{ length: 0.9989, expected: false },
	])('returns $expected for a direction of length $length', ({ length, expected }) => {
		expect(isUnitOrientationVector({ ...pose, oX: 0, oY: 0, oZ: length })).toBe(expected)
	})
})
