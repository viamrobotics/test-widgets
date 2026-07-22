import type { Pose } from '@viamrobotics/sdk'

const poseKeys = ['x', 'y', 'z', 'oX', 'oY', 'oZ', 'theta'] as const

const isPose = (value: unknown): value is Pose => {
	if (typeof value !== 'object' || value === null) {
		return false
	}

	const record = value as Record<string, unknown>
	return poseKeys.every((key) => typeof record[key] === 'number')
}

/**
 * Parses a clipboard string as a pose. Accepts a JSON object with numeric
 * `x`, `y`, `z`, `oX`, `oY`, `oZ`, and `theta` fields — the same shape the pose
 * editor copies, so poses can be pasted between any widget that edits one.
 *
 * @param data - The pasted string.
 * @returns The parsed pose, or `undefined` if it is not a valid pose.
 */
export const parsePastedPose = (data: string): Pose | undefined => {
	let parsed: unknown
	try {
		parsed = JSON.parse(data)
	} catch {
		return undefined
	}

	if (!isPose(parsed)) {
		return undefined
	}

	const { x, y, z, oX, oY, oZ, theta } = parsed
	return { x, y, z, oX, oY, oZ, theta }
}
