export interface PowerRange {
	min: number
	max: number
}

const FULL_RANGE: PowerRange = { min: 0, max: 1 }

/**
 * The power fractions the slider spans. The configured `min_power_pct` and `max_power_pct` are
 * used only when 0 <= min < max <= 1, with an absent min meaning 0 and an absent max meaning 1.
 * Any other pair is ignored and the full 0 to 1 range applies.
 */
export const resolvePowerRange = (
	minPowerPct: number | undefined,
	maxPowerPct: number | undefined
): PowerRange => {
	const min = minPowerPct ?? FULL_RANGE.min
	const max = maxPowerPct ?? FULL_RANGE.max
	const isValid =
		Number.isFinite(min) &&
		Number.isFinite(max) &&
		min >= FULL_RANGE.min &&
		min < max &&
		max <= FULL_RANGE.max
	return isValid ? { min, max } : FULL_RANGE
}
