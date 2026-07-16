import { describe, expect, it } from 'vitest'

import { movableFrameNames } from '../movable-frame-names'

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
