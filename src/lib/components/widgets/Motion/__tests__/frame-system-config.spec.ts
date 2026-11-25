import { describe, expect, it } from 'vitest'

import { movableFrameNames, parentFrame, referenceFrameNames } from '../frame-system-config'

describe('movableFrameNames', () => {
	it('returns an empty list when the config is undefined', () => {
		expect(movableFrameNames(undefined)).toEqual([])
	})

	it('extracts reference frame names sorted alphabetically', () => {
		const config = [
			{ frame: { referenceFrame: 'gripper' } },
			{ frame: { referenceFrame: 'arm' } },
			{ frame: { referenceFrame: 'gantry' } },
		]

		expect(movableFrameNames(config)).toEqual(['arm', 'gantry', 'gripper'])
	})

	it('drops entries with no frame or an empty reference frame', () => {
		const config = [{ frame: { referenceFrame: 'arm' } }, { frame: { referenceFrame: '' } }, {}]

		expect(movableFrameNames(config)).toEqual(['arm'])
	})
})

describe('parentFrame', () => {
	const config = [
		{ frame: { referenceFrame: 'arm', poseInObserverFrame: { referenceFrame: 'base' } } },
		{ frame: { referenceFrame: 'gripper', poseInObserverFrame: { referenceFrame: 'world' } } },
		{ frame: { referenceFrame: 'orphan' } },
	]

	it('returns the parent frame the component is attached to', () => {
		expect(parentFrame(config, 'arm')).toBe('base')
	})

	it("falls back to 'world' when the component has no configured parent", () => {
		expect(parentFrame(config, 'orphan')).toBe('world')
	})

	it("falls back to 'world' when the component is not in the config", () => {
		expect(parentFrame(config, 'missing')).toBe('world')
	})

	it("falls back to 'world' when the config is undefined", () => {
		expect(parentFrame(undefined, 'arm')).toBe('world')
	})
})

describe('referenceFrameNames', () => {
	it("returns just 'world' when the config is undefined", () => {
		expect(referenceFrameNames(undefined)).toEqual(['world'])
	})

	it("lists 'world' first, then the configured frames alphabetically", () => {
		const config = [{ frame: { referenceFrame: 'gripper' } }, { frame: { referenceFrame: 'arm' } }]

		expect(referenceFrameNames(config)).toEqual(['world', 'arm', 'gripper'])
	})

	it("does not duplicate 'world' when it is already a configured frame", () => {
		const config = [{ frame: { referenceFrame: 'world' } }, { frame: { referenceFrame: 'arm' } }]

		expect(referenceFrameNames(config)).toEqual(['world', 'arm'])
	})
})
