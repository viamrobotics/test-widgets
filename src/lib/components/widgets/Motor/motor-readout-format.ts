import { formatNumeric } from '$lib/format'

/** What a motor readout shows when it has no value to show. */
export const MISSING_VALUE = '-'

/** IsPowered's power_pct arrives as a fraction from 0 to 1. */
const PERCENT_PER_FRACTION = 100
const POWER_DECIMAL_PLACES = 1
const POSITION_DECIMAL_PLACES = 4

/** The power readout: the percent while powered, the missing value while not. */
export const formatPowerReadout = (isPowered: boolean, powerFraction: number): string =>
	isPowered
		? `${formatNumeric(powerFraction * PERCENT_PER_FRACTION, POWER_DECIMAL_PLACES)}%`
		: MISSING_VALUE

/** A GetPosition value in revolutions. */
export const formatPositionReadout = (revolutions: number): string =>
	formatNumeric(revolutions, POSITION_DECIMAL_PLACES)
