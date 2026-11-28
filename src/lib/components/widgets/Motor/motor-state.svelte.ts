import { createInFlightGuard, type InFlightGuard } from '#lib/components/in-flight-guard.svelte.js'
import { defineResourceState } from '#lib/resource-widget-state.js'

/** What every widget for one motor shares below one `WidgetsProvider`. */
interface MotorState {
	/**
	 * Every call that commands the motor's motion: QuickMove's holds, Move's Execute and Reset zero,
	 * SetPower, SetRpm, GoFor, GoTo, and ResetZeroPosition. A re-zero mid-GoTo contradicts the
	 * target, so it joins the group. Stop is in no group, so it always sends.
	 */
	motion: InFlightGuard
}

/** Returns the state the motor widgets naming one `partID` and `resourceName` share. */
export const useMotorState = defineResourceState<MotorState>('motor', () => ({
	motion: createInFlightGuard(),
}))
