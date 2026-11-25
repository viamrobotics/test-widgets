import { MathUtils, Quaternion, Vector3 } from 'three'

import {
	type OrientationVectorDegrees,
	orientationVectorToQuaternion,
	quaternionToOrientationVector,
} from './orientation-vector'

export type JogFrame = 'world' | 'end-effector'
export type JogAxis = 'x' | 'y' | 'z'
export type JogMotion =
	| { kind: 'translate'; axis: JogAxis; millimeters: number }
	| { kind: 'rotate'; axis: JogAxis; degrees: number }

/** Position in mm and orientation vector, as on a Viam `Pose`. */
export interface JogPose extends OrientationVectorDegrees {
	x: number
	y: number
	z: number
}

const unitAxes: Record<JogAxis, Vector3> = {
	x: new Vector3(1, 0, 0),
	y: new Vector3(0, 1, 0),
	z: new Vector3(0, 0, 1),
}

const endEffectorAxis = (start: JogPose, axis: JogAxis): Vector3 =>
	unitAxes[axis].clone().applyQuaternion(orientationVectorToQuaternion(start))

/**
 * Composes one jog step onto the start pose and returns a new pose. A rotate leaves the position
 * unchanged. A world rotate pre-multiplies the start orientation, an end-effector rotate
 * post-multiplies it.
 */
export function composeJogGoal(start: JogPose, motion: JogMotion, frame: JogFrame): JogPose {
	if (motion.kind === 'translate') {
		const direction =
			frame === 'world' ? unitAxes[motion.axis].clone() : endEffectorAxis(start, motion.axis)
		direction.multiplyScalar(motion.millimeters)
		return {
			...start,
			x: start.x + direction.x,
			y: start.y + direction.y,
			z: start.z + direction.z,
		}
	}

	const startQuaternion = orientationVectorToQuaternion(start)
	const rotation = new Quaternion().setFromAxisAngle(
		unitAxes[motion.axis],
		MathUtils.degToRad(motion.degrees)
	)
	const goal =
		frame === 'world' ? rotation.multiply(startQuaternion) : startQuaternion.multiply(rotation)

	return { x: start.x, y: start.y, z: start.z, ...quaternionToOrientationVector(goal) }
}

/** Signed mm from `start` to `current`, projected on the start end-effector's `axis`. */
export function travelAlongAxis(start: JogPose, current: JogPose, axis: JogAxis): number {
	const delta = new Vector3(current.x - start.x, current.y - start.y, current.z - start.z)
	return delta.dot(endEffectorAxis(start, axis))
}
