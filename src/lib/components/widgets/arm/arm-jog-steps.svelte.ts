/** The Position step a new arm jog starts with, from the Arm-Control board. */
export const DEFAULT_POSITION_STEP_MILLIMETERS = 10
/** The Orientation step a new arm jog starts with, from the Arm-Control board. */
export const DEFAULT_ORIENTATION_STEP_DEGREES = 5
/** The Joint step a new arm jog starts with, from the Arm-Control board. */
export const DEFAULT_JOINT_STEP_DEGREES = 5

/**
 * The step sizes an arm jog reads at each press. `ArmControls` creates one and passes it to both
 * the `jog` and `joints` controls, so its one Steps folder feeds both. A standalone control
 * creates its own.
 */
export interface ArmJogSteps {
	positionMillimeters: number
	orientationDegrees: number
	jointDegrees: number
	/** Sends `linear_constraint` with each position and orientation step. On by default. */
	isStraightLine: boolean
}

/** Creates reactive step sizes at the board's defaults. */
export function createArmJogSteps(): ArmJogSteps {
	const steps = $state<ArmJogSteps>({
		positionMillimeters: DEFAULT_POSITION_STEP_MILLIMETERS,
		orientationDegrees: DEFAULT_ORIENTATION_STEP_DEGREES,
		jointDegrees: DEFAULT_JOINT_STEP_DEGREES,
		isStraightLine: true,
	})
	return steps
}
