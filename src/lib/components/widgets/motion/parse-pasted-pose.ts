import type { Pose } from '@viamrobotics/sdk'

const poseKeys = ['x', 'y', 'z', 'oX', 'oY', 'oZ', 'theta'] as const

/**
 * Parses a clipboard string as a pose. Accepts a JSON object with numeric
 * `x`, `y`, `z`, `oX`, `oY`, `oZ`, and `theta` fields — the same shape the arm
 * `MoveToPosition` widget copies, so poses can be pasted between the two.
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

	if (typeof parsed !== 'object' || parsed === null) {
		return undefined
	}

	const record = parsed as Record<string, unknown>
	if (!poseKeys.every((key) => typeof record[key] === 'number')) {
		return undefined
	}

	return {
		x: record.x as number,
		y: record.y as number,
		z: record.z as number,
		oX: record.oX as number,
		oY: record.oY as number,
		oZ: record.oZ as number,
		theta: record.theta as number,
	}
}
