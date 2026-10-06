import type { Pose } from '@viamrobotics/sdk'

import type { OrientationVector } from '$lib/orientation-vector-quaternion'

import { type EulerDegrees, orientationVectorToEuler } from '$lib/orientation-vector-euler'

import type { PoseFieldStatus } from './pose-field-status'

export type EulerAngle = keyof EulerDegrees

type OrientationKey = 'oX' | 'oY' | 'oZ' | 'theta'

const HALF_TURN_DEGREES = 180
const FULL_TURN_DEGREES = 360

/** Half the fields' 0.1° step: two angles that round to the same shown value differ by less. */
const ANGLE_PRECISION_DEGREES = 0.05

/** The shortest absolute distance between two angles, so 179.98 and -179.99 are 0.03° apart. */
const wrappedAngleDistance = (from: number, to: number): number => {
	const turns = Math.round((to - from) / FULL_TURN_DEGREES)
	const wrapped = to - from - turns * FULL_TURN_DEGREES
	return Math.min(Math.abs(wrapped), HALF_TURN_DEGREES)
}

/**
 * The status of one Euler angle field, derived from the statuses of the four orientation-vector
 * fields behind it. Per angle, by value: an angle reads edited only when its target differs from
 * its live value by at least 0.05°, so editing one angle leaves its siblings untouched. Degrees
 * throughout.
 */
export const eulerFieldStatus = (
	angle: EulerAngle,
	target: Pose,
	orientationStatus: (key: OrientationKey) => PoseFieldStatus
): PoseFieldStatus => {
	const oX = orientationStatus('oX')
	const oY = orientationStatus('oY')
	const oZ = orientationStatus('oZ')
	const theta = orientationStatus('theta')
	const statuses = [oX, oY, oZ, theta]

	const live: OrientationVector = {
		oX: oX.current,
		oY: oY.current,
		oZ: oZ.current,
		theta: theta.current,
	}
	const current = orientationVectorToEuler(live)[angle]
	const isMoving = statuses.some((status) => status.isMoving)
	const isAnyKeyEdited = statuses.some((status) => status.isEdited)

	const isEdited =
		isAnyKeyEdited &&
		wrappedAngleDistance(current, orientationVectorToEuler(target)[angle]) >=
			ANGLE_PRECISION_DEGREES

	if (!isEdited || !statuses.some((status) => status.drift !== undefined)) {
		return { current, isEdited, drift: undefined, isMoving }
	}

	const baseline: OrientationVector = {
		oX: oX.baseline ?? oX.current,
		oY: oY.baseline ?? oY.current,
		oZ: oZ.baseline ?? oZ.current,
		theta: theta.baseline ?? theta.current,
	}
	const movement = wrappedAngleDistance(orientationVectorToEuler(baseline)[angle], current)

	return {
		current,
		isEdited,
		drift: movement < ANGLE_PRECISION_DEGREES ? undefined : movement,
		isMoving,
	}
}
