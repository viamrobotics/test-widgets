import type { Pose } from '@viamrobotics/sdk'

/**
 * Scales (oX, oY, oZ) to unit length. A zero direction becomes (0, 0, 1), as rdk's
 * `Normalize` does. Position and theta pass through unchanged.
 */
export const normalizeOrientationVector = (pose: Pose): Pose => {
	const length = Math.hypot(pose.oX, pose.oY, pose.oZ)
	if (length === 0) {
		return { ...pose, oX: 0, oY: 0, oZ: 1 }
	}
	return { ...pose, oX: pose.oX / length, oY: pose.oY / length, oZ: pose.oZ / length }
}

const UNIT_LENGTH_TOLERANCE = 1e-3

/** Whether (oX, oY, oZ) has length within 1e-3 of 1, the precision the OX, OY, OZ fields show. */
export const isUnitOrientationVector = (pose: Pose): boolean => {
	return Math.abs(Math.hypot(pose.oX, pose.oY, pose.oZ) - 1) <= UNIT_LENGTH_TOLERANCE
}
