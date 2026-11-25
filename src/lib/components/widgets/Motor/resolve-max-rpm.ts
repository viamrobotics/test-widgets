/**
 * The RPM limit to enforce, or `undefined` for none. A configured `max_rpm` is used only when it
 * is finite and above 0, and anything else is ignored as if it were absent.
 */
export const resolveMaxRpm = (maxRpm: number | undefined): number | undefined =>
	maxRpm !== undefined && Number.isFinite(maxRpm) && maxRpm > 0 ? maxRpm : undefined
