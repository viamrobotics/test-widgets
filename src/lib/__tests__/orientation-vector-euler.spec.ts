import { describe, expect, it } from 'vitest'

import {
	eulerToOrientationVector,
	isEulerGimbalLocked,
	orientationVectorToEuler,
} from '$lib/orientation-vector-euler'

const PRECISION = 6

describe('orientationVectorToEuler', () => {
	it('reads (0, 0, -1, 90) as roll 180, pitch 0, yaw 90, as computed with motion-tools in SHELL.md', () => {
		const euler = orientationVectorToEuler({ oX: 0, oY: 0, oZ: -1, theta: 90 })

		expect(euler.roll).toBeCloseTo(180, PRECISION)
		expect(euler.pitch).toBeCloseTo(0, PRECISION)
		expect(euler.yaw).toBeCloseTo(90, PRECISION)
	})

	it('reads an orientation vector along +X as pitch 90', () => {
		const euler = orientationVectorToEuler({ oX: 1, oY: 0, oZ: 0, theta: 0 })

		expect(euler.pitch).toBeCloseTo(90, PRECISION)
	})
})

describe('eulerToOrientationVector', () => {
	it('turns zero Euler angles into the identity orientation vector', () => {
		const orientation = eulerToOrientationVector({ roll: 0, pitch: 0, yaw: 0 })

		expect(orientation.oX).toBeCloseTo(0, PRECISION)
		expect(orientation.oY).toBeCloseTo(0, PRECISION)
		expect(orientation.oZ).toBeCloseTo(1, PRECISION)
		expect(orientation.theta).toBeCloseTo(0, PRECISION)
	})

	it('round-trips a non-pole orientation vector through Euler angles', () => {
		const original = {
			oX: 0.7391989197401165,
			oY: 0.2803300858899107,
			oZ: 0.6123724356957945,
			theta: 26.565051177078,
		}

		const roundTripped = eulerToOrientationVector(orientationVectorToEuler(original))

		expect(roundTripped.oX).toBeCloseTo(original.oX, PRECISION)
		expect(roundTripped.oY).toBeCloseTo(original.oY, PRECISION)
		expect(roundTripped.oZ).toBeCloseTo(original.oZ, PRECISION)
		expect(roundTripped.theta).toBeCloseTo(original.theta, PRECISION)
	})
})

describe('isEulerGimbalLocked', () => {
	it.each([
		[89.96, true],
		[-89.96, true],
		[89.94, false],
		[-89.94, false],
		[0, false],
	])('pitch %s is locked: %s', (pitch, expected) => {
		expect(isEulerGimbalLocked({ roll: 10, pitch, yaw: 20 })).toBe(expected)
	})
})
