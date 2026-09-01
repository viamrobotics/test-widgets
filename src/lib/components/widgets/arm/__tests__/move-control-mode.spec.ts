import { describe, expect, it } from 'vitest'

import {
	defaultMoveControlMode,
	motionServiceOptions,
	moveMotionServiceName,
} from '../move-control-mode'

describe('defaultMoveControlMode', () => {
	it('is direct when no motion service exists', () => {
		expect(defaultMoveControlMode([])).toBe('direct')
	})

	it('is motion when a motion service exists', () => {
		expect(defaultMoveControlMode(['builtin'])).toBe('motion')
	})

	it('is motion when a non-builtin motion service exists', () => {
		expect(defaultMoveControlMode(['custom-motion'])).toBe('motion')
	})
})

describe('moveMotionServiceName', () => {
	it('is undefined when no motion service exists', () => {
		expect(moveMotionServiceName([])).toBeUndefined()
	})

	it('picks builtin when it is the only service', () => {
		expect(moveMotionServiceName(['builtin'])).toBe('builtin')
	})

	it('picks builtin when it is among many services', () => {
		expect(moveMotionServiceName(['custom-motion', 'builtin', 'another-motion'])).toBe('builtin')
	})

	it('falls back to the first discovered service when there is no builtin', () => {
		expect(moveMotionServiceName(['custom-motion', 'another-motion'])).toBe('custom-motion')
	})
})

describe('motionServiceOptions', () => {
	it('orders builtin first and sorts the rest alphabetically from unsorted input', () => {
		expect(motionServiceOptions(['zebra-motion', 'builtin', 'apple-motion'])).toEqual([
			'builtin',
			'apple-motion',
			'zebra-motion',
		])
	})

	it('sorts alphabetically when there is no builtin', () => {
		expect(motionServiceOptions(['zebra-motion', 'apple-motion'])).toEqual([
			'apple-motion',
			'zebra-motion',
		])
	})

	it('returns an empty list when there are no motion services', () => {
		expect(motionServiceOptions([])).toEqual([])
	})
})
