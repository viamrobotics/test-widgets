import {
	createInFlightGuard,
	type InFlightGuard,
	type InFlightOutcome,
} from '#lib/components/in-flight-guard.svelte.js'
import { defineResourceState } from '#lib/resource-widget-state.js'

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
	 * The highest angle the user set in MoveTo's Max field, which QuickMove's steps and Move's
	 * Execute stop at when the servo config gives no maximum.
	 */
	limits: { userMaxDegrees: number }
	/**
	 * The angle of the last Move that succeeded, until the servo is read there. QuickMove steps
	 * from it, since the polled position can be older than that Move. A failed Move and Stop clear it.
	 */
	commanded: { degrees: number | undefined }
}

/** Records how a Move to `degrees` ended. Every widget that moves the servo calls it. */
export const recordServoMove = (
	commanded: ServoState['commanded'],
	degrees: number,
	outcome: InFlightOutcome
) => {
	commanded.degrees = outcome === 'succeeded' ? degrees : undefined
}

/** Returns the state the servo widgets naming one `partID` and `resourceName` share. */
export const useServoState = defineResourceState<ServoState>('servo', () => {
	const limits = $state({ userMaxDegrees: DEFAULT_SERVO_MAX_DEGREES })
	const commanded = $state<ServoState['commanded']>({ degrees: undefined })
	return { motion: createInFlightGuard(), limits, commanded }
})
