import { Constraints, type JsonValue, type MotionClient, WorldState } from '@viamrobotics/sdk'

/** The joint inputs of one step per component, positional by joint. Radians, or mm if prismatic. */
export type TrajectoryStep = Record<string, number[]>

export class PlanCommandError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options)
		this.name = 'PlanCommandError'
	}
}

/** Selects RDK's `defaultExecuteEpsilon` (0.01 rad or mm): builtin reads any value at or below zero as "use the default". */
const RDK_DEFAULT_EPSILON = 0

const isJsonObject = (value: unknown): value is Record<string, JsonValue> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

type MoveDestination = Parameters<MotionClient['move']>[0]

const finitePose = (destination: MoveDestination): NonNullable<MoveDestination['pose']> => {
	const { pose } = destination
	if (
		!pose ||
		!Object.values(pose).every((value) => typeof value !== 'number' || Number.isFinite(value))
	) {
		throw new PlanCommandError('The move target is not a finite pose.')
	}
	return pose
}

/** The move's own `extra`, plus `start_state` when the plan starts from a given step. */
const planExtra = (
	extra: Parameters<MotionClient['move']>[4],
	startState: TrajectoryStep | undefined
): Record<string, JsonValue> => {
	const extraJson: unknown = structuredClone(extra ?? {})
	const extraFields = isJsonObject(extraJson) ? extraJson : {}
	if (startState) extraFields.start_state = { configuration: { ...startState } }
	return extraFields
}

/**
 * The builtin service's `plan` verb, absent from the motion proto. RDK `protojson.Unmarshal`s the
 * string, so the payload uses protojson names (`componentName`, `oX`) in millimeters and degrees.
 *
 * @param startState Planned from instead of the arm's current joints. Sent as `extra.start_state`.
 * @throws {PlanCommandError} When `moveArgs` carries a non-finite pose.
 */
export const planCommand = (
	moveArgs: Parameters<MotionClient['move']>,
	startState: TrajectoryStep | undefined
): Record<string, JsonValue> => {
	const [destination, componentName, worldState, constraints, extra] = moveArgs
	const pose = finitePose(destination)

	const moveRequest: Record<string, JsonValue> = {
		componentName,
		destination: {
			referenceFrame: destination.referenceFrame,
			pose: {
				x: pose.x,
				y: pose.y,
				z: pose.z,
				oX: pose.oX,
				oY: pose.oY,
				oZ: pose.oZ,
				theta: pose.theta,
			},
		},
	}
	// Plain messages have no `toJson`, so rebuilding the class is what reaches protojson.
	if (worldState) moveRequest.worldState = new WorldState(worldState).toJson()
	if (constraints) moveRequest.constraints = new Constraints(constraints).toJson()

	const extraFields = planExtra(extra, startState)
	if (Object.keys(extraFields).length > 0) moveRequest.extra = extraFields

	return { plan: JSON.stringify(moveRequest) }
}

/**
 * The builtin service's `execute` verb, which runs a trajectory verbatim. `executeCheckStart`'s
 * presence is the switch: without it the trajectory runs from wherever the arm is.
 */
export const executeCommand = (
	trajectory: readonly TrajectoryStep[]
): Record<string, JsonValue> => ({
	execute: trajectory.map((step) => ({ ...step })),
	executeCheckStart: RDK_DEFAULT_EPSILON,
})

/**
 * Joins consecutive plans into one trajectory for a single `execute`. Each later plan starts at
 * the previous one's last step, so its first step is dropped. RDK batches consecutive steps for
 * one component into one `GoToInputs` call, so the arm does not stop at the joins.
 *
 * @throws {PlanCommandError} When given no trajectories.
 */
export const joinTrajectories = (
	trajectories: readonly (readonly TrajectoryStep[])[]
): TrajectoryStep[] => {
	if (trajectories.length === 0) {
		throw new PlanCommandError('There are no trajectories to join.')
	}
	return trajectories.flatMap((trajectory, index) =>
		trajectory.slice(index === 0 ? 0 : 1).map((step) => structuredClone(step))
	)
}

// Finite, not merely numeric, since `typeof NaN === 'number'`. A step must name a component.
const isTrajectoryStep = (step: unknown): step is TrajectoryStep =>
	isJsonObject(step) &&
	Object.keys(step).length > 0 &&
	Object.values(step).every(
		(inputs) => Array.isArray(inputs) && inputs.every((input) => Number.isFinite(input))
	)

const isOldInputShape = (step: unknown): boolean =>
	isJsonObject(step) &&
	Object.values(step).some(
		(inputs) =>
			Array.isArray(inputs) && inputs.some((input) => isJsonObject(input) && 'Value' in input)
	)

/**
 * Says how a trajectory that failed the step check is malformed. Each way a reply can be wrong gets
 * its own message, since there is no version RPC to explain it by.
 */
const describeMalformedTrajectory = (trajectory: readonly unknown[]): string => {
	for (const step of trajectory) {
		if (Array.isArray(step)) {
			return step.length === 0
				? 'Motion service returned a trajectory step naming no components.'
				: 'Motion service returned a trajectory step with unnamed joint values.'
		}
		if (!isJsonObject(step)) {
			return 'Motion service returned a null trajectory step.'
		}
		const columns = Object.entries(step)
		if (columns.length === 0) {
			return 'Motion service returned a trajectory step naming no components.'
		}
		for (const [name, inputs] of columns) {
			const problem = describeMalformedInputs(inputs)
			if (problem) return `Motion service returned ${problem} for component "${name}".`
		}
	}
	return 'Motion service returned a trajectory this client cannot read.'
}

const describeMalformedInputs = (inputs: JsonValue): string | undefined => {
	if (!Array.isArray(inputs)) return 'a non-list joint value'
	if (inputs.includes(null)) return 'a null joint value'
	if (inputs.some((input) => typeof input !== 'number')) return 'a non-numeric joint value'
	if (inputs.some((input) => !Number.isFinite(input))) return 'a non-finite joint value'
	return undefined
}

export interface PlanResult {
	trajectory: TrajectoryStep[]
}

/**
 * Reads a `plan` reply. It mirrors `parsePlanResult` in `@viamrobotics/visualization`, which the
 * main entry cannot import: same result shape, same messages.
 *
 * @throws {PlanCommandError} For anything but a non-empty list of named, finite steps. An empty
 * result would otherwise read as "planned, nothing to show".
 */
export const parsePlanResult = (value: JsonValue): PlanResult => {
	if (!isJsonObject(value)) {
		throw new PlanCommandError('Motion service returned an unexpected plan response.')
	}
	const trajectory = value.plan
	// A Go nil trajectory marshals to JSON `null`, which is nothing to draw, as an absent key is.
	if (trajectory === undefined || trajectory === null) {
		throw new PlanCommandError('Motion service returned no trajectory for this move.')
	}
	if (!Array.isArray(trajectory)) {
		throw new PlanCommandError('Motion service returned a trajectory that is not a list of steps.')
	}
	// RDK before about v0.101 wrote each input as `{ Value: number }`.
	if (trajectory.some((step) => isOldInputShape(step))) {
		throw new PlanCommandError(
			'Motion service returned a trajectory using an older joint-value format. The machine may be running an older version of RDK.'
		)
	}
	if (!trajectory.every((step) => isTrajectoryStep(step))) {
		throw new PlanCommandError(describeMalformedTrajectory(trajectory))
	}
	if (trajectory.length === 0) {
		throw new PlanCommandError('Motion service returned an empty trajectory.')
	}
	return { trajectory }
}
