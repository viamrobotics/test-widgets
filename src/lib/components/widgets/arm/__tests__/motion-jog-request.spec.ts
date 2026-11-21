import { describe, expect, it } from 'vitest'

import type { JogPose } from '../jog-pose-goal'

import {
	JOG_PLANNER_TIMEOUT_SECONDS,
	jointGoalMoveArgs,
	poseGoalMoveArgs,
} from '../motion-jog-request'

const pose: JogPose = { x: 1, y: 2, z: 3, oX: 0, oY: 0, oZ: 1, theta: 90 }

describe('poseGoalMoveArgs', () => {
	it('moves the arm to the pose in world with the jog timeout', () => {
		const [destination, componentName, worldState, , extra] = poseGoalMoveArgs({
			armName: 'arm-1',
			goal: pose,
			isStraightLine: false,
		})
		expect(destination).toEqual({ referenceFrame: 'world', pose })
		expect(componentName).toBe('arm-1')
		expect(worldState).toBeUndefined()
		expect(extra).toEqual({ timeout: JOG_PLANNER_TIMEOUT_SECONDS })
	})

	it('sends one linear constraint for a straight line', () => {
		const constraints = poseGoalMoveArgs({
			armName: 'arm-1',
			goal: pose,
			isStraightLine: true,
		})[3]
		expect(constraints?.linearConstraint).toHaveLength(1)
	})

	it('sends no constraints otherwise', () => {
		const constraints = poseGoalMoveArgs({
			armName: 'arm-1',
			goal: pose,
			isStraightLine: false,
		})[3]
		expect(constraints).toBeUndefined()
	})
})

describe('jointGoalMoveArgs', () => {
	it('sends the current pose as destination and the joints as radians in goal_state', () => {
		const [destination, componentName, , constraints, extra] = jointGoalMoveArgs({
			armName: 'arm-1',
			currentPose: pose,
			jointDegrees: [0, 90, -180],
		})
		expect(destination).toEqual({ referenceFrame: 'world', pose })
		expect(componentName).toBe('arm-1')
		expect(constraints).toBeUndefined()
		expect(extra).toEqual({
			goal_state: { configuration: { 'arm-1': [0, Math.PI / 2, -Math.PI] } },
			timeout: JOG_PLANNER_TIMEOUT_SECONDS,
		})
	})
})
