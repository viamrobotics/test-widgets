import { describe, expect, it } from 'vitest'

import type { FrameConfigEntry } from '../../motion/frame-system-config'

import { canPlanMotion, motionServiceOptions, moveMotionServiceName } from '../move-control-mode'

const frameSystemOf = (...frameNames: string[]): FrameConfigEntry[] =>
	frameNames.map((referenceFrame) => ({ frame: { referenceFrame } }))

describe('canPlanMotion', () => {
	it('is false when no motion service exists', () => {
		expect(canPlanMotion([], frameSystemOf('arm-1'), 'arm-1')).toBe(false)
	})

	it('is false when the arm has no frame in the frame system', () => {
		expect(canPlanMotion(['builtin'], frameSystemOf('other-arm'), 'arm-1')).toBe(false)
	})

	it('is false when the frame system is empty', () => {
		expect(canPlanMotion(['builtin'], [], 'arm-1')).toBe(false)
	})

	it('is true when a motion service exists and the arm has a frame', () => {
		expect(canPlanMotion(['builtin'], frameSystemOf('other-arm', 'arm-1'), 'arm-1')).toBe(true)
	})

	it('is true for a non-builtin motion service', () => {
		expect(canPlanMotion(['custom-motion'], frameSystemOf('arm-1'), 'arm-1')).toBe(true)
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
