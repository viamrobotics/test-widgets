import type { Pose } from '@viamrobotics/sdk'

export type PoseKey = keyof Pose

export const POSE_KEYS: PoseKey[] = ['x', 'y', 'z', 'oX', 'oY', 'oZ', 'theta']

// Tight enough to catch a real move, loose enough to ignore encoder noise. Theta is in degrees.
export const DRIFT_THRESHOLDS: Record<PoseKey, number> = {
	x: 1,
	y: 1,
	z: 1,
	oX: 0.01,
	oY: 0.01,
	oZ: 0.01,
	theta: 0.5,
}
