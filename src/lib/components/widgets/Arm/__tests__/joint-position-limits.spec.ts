import { describe, expect, it } from 'vitest'

import { getOutOfBoundsSide, isOutsideJointLimit } from '../joint-position-limits'

describe('isOutsideJointLimit', () => {
	it('returns false when value is within bounds', () => {
		expect(isOutsideJointLimit(0, -90, 90)).toBe(false)
		expect(isOutsideJointLimit(-90, -90, 90)).toBe(false)
		expect(isOutsideJointLimit(90, -90, 90)).toBe(false)
	})

	it('returns true when value is below min or above max', () => {
		expect(isOutsideJointLimit(-90.01, -90, 90)).toBe(true)
		expect(isOutsideJointLimit(90.01, -90, 90)).toBe(true)
	})
})

describe('getOutOfBoundsSide', () => {
	it('returns below-min when value is under the minimum', () => {
		expect(getOutOfBoundsSide(-91, -90, 90)).toBe('below-min')
	})

	it('returns above-max when value is over the maximum', () => {
		expect(getOutOfBoundsSide(91, -90, 90)).toBe('above-max')
	})

	it('returns null when value is in range', () => {
		expect(getOutOfBoundsSide(0, -90, 90)).toBeNull()
	})
})
