import { Constraints, type Pose, type PoseInFrame, WorldState } from '@viamrobotics/sdk'

/** User-entered inputs for a motion `Move` call. Pose is always mm + degrees. */
export interface MoveInput {
	referenceFrame: string
	pose: Pose
	/** Optional `WorldState` as proto JSON. Empty/whitespace means "omit". */
	worldStateJson: string
	/** Optional `Constraints` as proto JSON. Empty/whitespace means "omit". */
	constraintsJson: string
}

/** Positional arguments for `MotionClient.move`, ready to spread into `mutate`. */
export type MoveArgs = [PoseInFrame, string, WorldState | undefined, Constraints | undefined]

/**
 * Builds the positional arguments for `MotionClient.move` from form inputs.
 *
 * Empty or whitespace-only JSON fields are omitted (passed as `undefined`).
 * Non-empty JSON is parsed with the generated message classes and throws on
 * invalid input — callers should catch and surface the error.
 *
 * @param frameName - The frame to move.
 * @param input - The pose, reference frame, and optional world-state/constraints JSON.
 * @returns The `[destination, frameName, worldState?, constraints?]` tuple.
 */
export const parseMoveArgs = (frameName: string, input: MoveInput): MoveArgs => {
	const destination: PoseInFrame = {
		referenceFrame: input.referenceFrame,
		pose: input.pose,
	}

	const worldState =
		input.worldStateJson.trim() === '' ? undefined : WorldState.fromJsonString(input.worldStateJson)

	const constraints =
		input.constraintsJson.trim() === ''
			? undefined
			: Constraints.fromJsonString(input.constraintsJson)

	return [destination, frameName, worldState, constraints]
}
