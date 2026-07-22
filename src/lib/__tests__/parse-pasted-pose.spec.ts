import { describe, expect, it } from 'vitest'

import { parsePastedPose } from '../parse-pasted-pose'

const pose = { x: 1, y: 2, z: 3, oX: 0, oY: 0, oZ: 1, theta: 45 }

describe('parsePastedPose', () => {
	it('parses a valid pose object', () => {
		expect(parsePastedPose(JSON.stringify(pose))).toEqual(pose)
	})

	it('ignores extra fields, returning only the pose keys', () => {
		expect(parsePastedPose(JSON.stringify({ ...pose, extra: 'nope' }))).toEqual(pose)
	})

	it('returns undefined when a pose field is missing', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { theta: _, ...withoutTheta } = pose
		expect(parsePastedPose(JSON.stringify(withoutTheta))).toBeUndefined()
	})

	it('returns undefined when a pose field is not a number', () => {
		expect(parsePastedPose(JSON.stringify({ ...pose, x: '1' }))).toBeUndefined()
	})

	it('returns undefined for invalid JSON', () => {
		expect(parsePastedPose('not json')).toBeUndefined()
	})

	it('returns undefined for non-object JSON', () => {
		expect(parsePastedPose('42')).toBeUndefined()
		expect(parsePastedPose('null')).toBeUndefined()
	})
})
