import { Constraints, LinearConstraint, type MotionClient } from '@viamrobotics/sdk'

import type { JogPose } from './jog-pose-goal'

/**
 * Seconds the planner may search, read by builtin as `extra.timeout`
 * (`planner_options.go`, a float64 in seconds). RDK's default is 300, far too long for a jog.
 */
export const JOG_PLANNER_TIMEOUT_SECONDS = 5

const DEGREES_TO_RADIANS = Math.PI / 180

export interface PoseGoalRequest {
	armName: string
	goal: JogPose
	/** Adds a `linearConstraint`, so a step the planner cannot draw straight fails instead of swinging a joint. */
	isStraightLine: boolean
}

export interface JointGoalRequest {
	armName: string
	/** Sent as `destination`, so a service that ignores `extra` plans a no-op. */
	currentPose: JogPose
	jointDegrees: readonly number[]
}

const worldPose = (pose: JogPose): Parameters<MotionClient['move']>[0] => ({
	referenceFrame: 'world',
	pose: {
		x: pose.x,
		y: pose.y,
		z: pose.z,
		oX: pose.oX,
		oY: pose.oY,
		oZ: pose.oZ,
		theta: pose.theta,
	},
})

/** The arguments of one absolute-pose `MotionClient.move` in `world`. */
export const poseGoalMoveArgs = ({
	armName,
	goal,
	isStraightLine,
}: PoseGoalRequest): Parameters<MotionClient['move']> => {
	const constraints = isStraightLine
		? new Constraints({ linearConstraint: [new LinearConstraint()] })
		: undefined
	return [
		worldPose(goal),
		armName,
		undefined,
		constraints,
		{ timeout: JOG_PLANNER_TIMEOUT_SECONDS },
	]
}

/**
 * The arguments of a joint-goal `MotionClient.move`. Only the builtin service reads
 * `extra.goal_state`. Arm inputs are radians, so the degrees convert here.
 */
export const jointGoalMoveArgs = ({
	armName,
	currentPose,
	jointDegrees,
}: JointGoalRequest): Parameters<MotionClient['move']> => [
	worldPose(currentPose),
	armName,
	undefined,
	undefined,
	{
		goal_state: {
			configuration: { [armName]: jointDegrees.map((degrees) => degrees * DEGREES_TO_RADIANS) },
		},
		timeout: JOG_PLANNER_TIMEOUT_SECONDS,
	},
]
