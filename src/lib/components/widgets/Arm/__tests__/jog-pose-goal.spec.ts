import { describe, expect, it } from 'vitest'

import { composeJogGoal, type JogPose, travelAlongAxis } from '../jog-pose-goal'

const DIGITS = 5

const upright: JogPose = { x: 100, y: 200, z: 300, oX: 0, oY: 0, oZ: 1, theta: 0 }
const pointingDown: JogPose = { x: 100, y: 200, z: 300, oX: 0, oY: 0, oZ: -1, theta: 0 }
const pointingAlongX: JogPose = { x: 0, y: 0, z: 0, oX: 1, oY: 0, oZ: 0, theta: 0 }

describe('composeJogGoal translate', () => {
	it('adds a world Z step to z', () => {
		const goal = composeJogGoal(upright, { kind: 'translate', axis: 'z', millimeters: 10 }, 'world')
		expect(goal.z).toBeCloseTo(310, DIGITS)
		expect(goal.x).toBeCloseTo(100, DIGITS)
		expect(goal.y).toBeCloseTo(200, DIGITS)
	})

	it('lowers world z for an end-effector Z step while pointing down', () => {
		const goal = composeJogGoal(
			pointingDown,
			{ kind: 'translate', axis: 'z', millimeters: 10 },
			'end-effector'
		)
		expect(goal.z).toBeCloseTo(290, DIGITS)
		expect(goal.x).toBeCloseTo(100, DIGITS)
		expect(goal.y).toBeCloseTo(200, DIGITS)
	})

	it('does not change the orientation', () => {
		const goal = composeJogGoal(
			pointingDown,
			{ kind: 'translate', axis: 'x', millimeters: 5 },
			'world'
		)
		expect(goal.oZ).toBe(-1)
		expect(goal.theta).toBe(0)
	})

	it('returns a new pose', () => {
		const goal = composeJogGoal(upright, { kind: 'translate', axis: 'x', millimeters: 1 }, 'world')
		expect(goal).not.toBe(upright)
		expect(upright.x).toBe(100)
	})
})

describe('composeJogGoal rotate', () => {
	it('turns a pose pointing along +X toward +Y for a world Z rotation of 90 degrees', () => {
		const goal = composeJogGoal(pointingAlongX, { kind: 'rotate', axis: 'z', degrees: 90 }, 'world')
		expect(goal.oX).toBeCloseTo(0, DIGITS)
		expect(goal.oY).toBeCloseTo(1, DIGITS)
		expect(goal.oZ).toBeCloseTo(0, DIGITS)
		expect(goal.theta).toBeCloseTo(0, DIGITS)
	})

	it('turns a pose pointing along +X toward -Z for an end-effector Y rotation of 90 degrees', () => {
		const goal = composeJogGoal(
			pointingAlongX,
			{ kind: 'rotate', axis: 'y', degrees: 90 },
			'end-effector'
		)
		expect(goal.oX).toBeCloseTo(0, DIGITS)
		expect(goal.oY).toBeCloseTo(0, DIGITS)
		expect(goal.oZ).toBeCloseTo(-1, DIGITS)
	})

	it('leaves the position unchanged', () => {
		const goal = composeJogGoal(upright, { kind: 'rotate', axis: 'x', degrees: 30 }, 'world')
		expect(goal.x).toBe(100)
		expect(goal.y).toBe(200)
		expect(goal.z).toBe(300)
	})
})

describe('travelAlongAxis', () => {
	it('is zero at rest', () => {
		expect(travelAlongAxis(pointingDown, pointingDown, 'z')).toBeCloseTo(0, DIGITS)
	})

	it('is positive when moving along the end-effector axis', () => {
		const current: JogPose = { ...pointingDown, z: 290 }
		expect(travelAlongAxis(pointingDown, current, 'z')).toBeCloseTo(10, DIGITS)
	})

	it('is negative when moving against the end-effector axis', () => {
		const current: JogPose = { ...pointingDown, z: 315 }
		expect(travelAlongAxis(pointingDown, current, 'z')).toBeCloseTo(-15, DIGITS)
	})

	it('ignores motion perpendicular to the axis', () => {
		const current: JogPose = { ...pointingDown, x: 150 }
		expect(travelAlongAxis(pointingDown, current, 'z')).toBeCloseTo(0, DIGITS)
	})
})
