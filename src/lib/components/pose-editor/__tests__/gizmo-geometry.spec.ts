import { Quaternion, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

import { arcPath, projectPoint, rollRingPath, VIEW_ROTATION } from '../gizmo-geometry'

const CENTER = 68
const IDENTITY = new Quaternion()

describe('projectPoint with identity view', () => {
	it('puts (1, 0, 0) to the right of center', () => {
		const { x, y } = projectPoint(new Vector3(1, 0, 0), IDENTITY, IDENTITY)
		expect(x).toBeCloseTo(118.76, 2)
		expect(y).toBeCloseTo(CENTER, 2)
	})

	it('puts (0, 1.1, 0) above center', () => {
		const { x, y } = projectPoint(new Vector3(0, 1.1, 0), IDENTITY, IDENTITY)
		expect(x).toBeCloseTo(CENTER, 2)
		expect(y).toBeCloseTo(CENTER - 55.83, 2)
	})

	it('puts (0.7, 0, 0) to the right of center', () => {
		expect(projectPoint(new Vector3(0.7, 0, 0), IDENTITY, IDENTITY).x).toBeCloseTo(
			CENTER + 35.53,
			2
		)
	})

	it('gives a nearer point a larger depth', () => {
		const near = projectPoint(new Vector3(0, 0, 0.5), IDENTITY, IDENTITY)
		const far = projectPoint(new Vector3(0, 0, -0.5), IDENTITY, IDENTITY)
		expect(near.depth).toBeGreaterThan(far.depth)
	})

	it('does not mutate the point', () => {
		const point = new Vector3(1, 2, 3)
		projectPoint(point, new Quaternion(0, 0, 1, 0), VIEW_ROTATION)
		expect(point.toArray()).toEqual([1, 2, 3])
	})
})

describe('projectPoint with the default view', () => {
	it('draws the +Z tip straight up from center', () => {
		const { x, y } = projectPoint(new Vector3(0, 0, 0.7), IDENTITY)
		expect(x).toBeCloseTo(CENTER, 6)
		expect(y).toBeLessThan(CENTER)
	})

	it('draws the +X tip left of and below center', () => {
		const { x, y } = projectPoint(new Vector3(0.7, 0, 0), IDENTITY)
		expect(x).toBeLessThan(CENTER)
		expect(y).toBeGreaterThan(CENTER)
	})

	it('draws the +Y tip right of and below center', () => {
		const { x, y } = projectPoint(new Vector3(0, 0.7, 0), IDENTITY)
		expect(x).toBeGreaterThan(CENTER)
		expect(y).toBeGreaterThan(CENTER)
	})
})

describe('arcPath', () => {
	it('returns a move followed by 32 line segments', () => {
		const path = arcPath('x', 'front', IDENTITY)
		expect(path.startsWith('M ')).toBe(true)
		expect(path.match(/M/g)).toHaveLength(1)
		expect(path.match(/L/g)).toHaveLength(32)
	})

	it('starts at a different point for the front and back halves', () => {
		const front = arcPath('y', 'front', IDENTITY)
		const back = arcPath('y', 'back', IDENTITY)
		expect(front.split('L')[0]).not.toBe(back.split('L')[0])
	})

	const MIDDLE_VERTEX_INDEX = 16
	const parsePoints = (path: string) =>
		path
			.split(/[ML]/)
			.filter(Boolean)
			.map((segment) => segment.trim().split(' ').map(Number))

	it('draws the half nearer the viewer for front', () => {
		const middle = parsePoints(arcPath('z', 'front', IDENTITY))[MIDDLE_VERTEX_INDEX]!
		const expected = projectPoint(new Vector3(1, 1, 0).normalize(), IDENTITY)
		expect(middle[0]).toBeCloseTo(expected.x, 1)
		expect(middle[1]).toBeCloseTo(expected.y, 1)
	})

	it('draws the half farther from the viewer for back', () => {
		const middle = parsePoints(arcPath('z', 'back', IDENTITY))[MIDDLE_VERTEX_INDEX]!
		const expected = projectPoint(new Vector3(-1, -1, 0).normalize(), IDENTITY)
		expect(middle[0]).toBeCloseTo(expected.x, 1)
		expect(middle[1]).toBeCloseTo(expected.y, 1)
	})

	it('handles an axis pointing at the viewer', () => {
		const path = arcPath('z', 'front', IDENTITY, IDENTITY)
		expect(path.match(/L/g)).toHaveLength(32)
		expect(path).not.toContain('NaN')
	})
})

describe('rollRingPath', () => {
	it('returns a move followed by 64 line segments', () => {
		const path = rollRingPath()
		expect(path.startsWith('M ')).toBe(true)
		expect(path.match(/L/g)).toHaveLength(64)
	})
})
