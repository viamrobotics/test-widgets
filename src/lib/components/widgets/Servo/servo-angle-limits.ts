/** The highest angle a servo control reaches until the user sets Max. The Servo API reports no range. */
export const DEFAULT_SERVO_MAX_DEGREES = 180

const SERVO_MIN_DEGREES = 0
export const SERVO_MAX_DEGREES_CAP = 360
/** The narrowest span a servo range keeps above its minimum, so the slider always has room to move. */
export const MINIMUM_SPAN_DEGREES = 1

export interface ServoRange {
	/** The lowest angle, 0 when no valid minimum is configured. */
	min: number
	/** The configured highest angle. Undefined when none is configured. */
	max: number | undefined
}

/**
 * The range a host's `min_angle_deg` and `max_angle_deg` describe. A value outside 0 to 360, or a
 * pair where min is not below max, is ignored as if it were absent.
 */
export const resolveServoRange = (minDegrees?: number, maxDegrees?: number): ServoRange => {
	const min =
		minDegrees !== undefined &&
		Number.isFinite(minDegrees) &&
		minDegrees >= SERVO_MIN_DEGREES &&
		minDegrees < SERVO_MAX_DEGREES_CAP
			? minDegrees
			: undefined
	const max =
		maxDegrees !== undefined &&
		Number.isFinite(maxDegrees) &&
		maxDegrees > SERVO_MIN_DEGREES &&
		maxDegrees <= SERVO_MAX_DEGREES_CAP
			? maxDegrees
			: undefined
	if (min !== undefined && max !== undefined && min >= max) {
		return { min: SERVO_MIN_DEGREES, max: undefined }
	}
	return { min: min ?? SERVO_MIN_DEGREES, max }
}

/** The highest angle in force: the configured maximum, else `fallback` kept above the minimum. */
export const effectiveServoMax = (
	range: ServoRange,
	fallback: number = DEFAULT_SERVO_MAX_DEGREES
): number =>
	range.max ?? Math.min(Math.max(fallback, range.min + MINIMUM_SPAN_DEGREES), SERVO_MAX_DEGREES_CAP)
