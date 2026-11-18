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
 * Parses optional `WorldState` proto JSON. Empty or whitespace-only input is omitted.
 *
 * @throws When the input is not valid `WorldState` JSON.
 */
export const parseWorldState = (json: string): WorldState | undefined =>
	json.trim() === '' ? undefined : WorldState.fromJsonString(json)

/**
 * Parses optional `Constraints` proto JSON. Empty or whitespace-only input is omitted.
 *
 * @throws When the input is not valid `Constraints` JSON.
 */
export const parseConstraints = (json: string): Constraints | undefined =>
	json.trim() === '' ? undefined : Constraints.fromJsonString(json)

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

	return [
		destination,
		frameName,
		parseWorldState(input.worldStateJson),
		parseConstraints(input.constraintsJson),
	]
}
