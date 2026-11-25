import { createInFlightGuard, type InFlightGuard } from '$lib/components/in-flight-guard.svelte'
import { defineResourceState } from '$lib/resource-widget-state'

import { DEFAULT_SERVO_MAX_DEGREES } from './servo-angle-limits'

/** What every widget for one servo shares below one `WidgetsProvider`. */
interface ServoState {
	/**
	 * Every call that moves the servo: Move's Execute, QuickMove's steps, and MoveTo's release and
	 * Move to 0°. Two moves contradict each other, so only one is in flight. Stop is in no group, so
	 * it always sends.
	 */
	motion: InFlightGuard
	/**
	 * The highest angle the user set in MoveTo's Max field, which QuickMove's steps stop at when the
	 * servo config gives no maximum.
	 */
	limits: { userMaxDegrees: number }
}

/** Returns the state the servo widgets naming one `partID` and `resourceName` share. */
export const useServoState = defineResourceState<ServoState>('servo', () => {
	const limits = $state({ userMaxDegrees: DEFAULT_SERVO_MAX_DEGREES })
	return { motion: createInFlightGuard(), limits }
})
