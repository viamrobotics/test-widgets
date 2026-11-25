import { resolveMaxRpm } from './resolve-max-rpm'

const MINIMUM_RPM = 0

/**
 * The RPM to send, or `undefined` when the field is empty, not finite, negative, or over the
 * limit from the config's `max_rpm`. A value over the limit is never clamped.
 */
export const readValidRpm = (
	rpm: number | undefined,
	maxRpm: number | undefined
): number | undefined => {
	if (rpm === undefined || !Number.isFinite(rpm) || rpm < MINIMUM_RPM) return undefined
	const limit = resolveMaxRpm(maxRpm)
	return limit !== undefined && rpm > limit ? undefined : rpm
}
