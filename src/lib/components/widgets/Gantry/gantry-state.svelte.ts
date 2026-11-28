import {
	createHoldCancelSignal,
	type HoldCancelSignal,
} from '#lib/components/hold-cancel-signal.js'
import { createInFlightGuard, type InFlightGuard } from '#lib/components/in-flight-guard.svelte.js'
import { defineResourceState } from '#lib/resource-widget-state.js'

/** Home's progress, which widgets that did not start it read. */
interface GantryHoming {
	/** True while Home's call is in flight. */
	isHoming: boolean
	/** The status line text for the motion group while Home holds it. Empty otherwise. */
	busyStatus: string
}

/** What every widget for one gantry shares below one `WidgetsProvider`. */
interface GantryState {
	/**
	 * Every call that commands the gantry's motion: Home, QuickMove's steps, and MoveToPosition.
	 * Every MoveToPosition carries every axis, so two moves contradict, and Home moves them all.
	 * Stop is in no group, so it always sends.
	 */
	motion: InFlightGuard
	/** Stop raises it, and QuickMove ends any hold in progress on it. */
	holdCancel: HoldCancelSignal
	/** Home writes it. QuickMove and HomingStatus read it. */
	homing: GantryHoming
}

const createGantryHoming = (): GantryHoming => {
	const homing = $state<GantryHoming>({ isHoming: false, busyStatus: '' })
	return homing
}

/** Returns the state the gantry widgets naming one `partID` and `resourceName` share. */
export const useGantryState = defineResourceState<GantryState>('gantry', () => ({
	motion: createInFlightGuard(),
	holdCancel: createHoldCancelSignal(),
	homing: createGantryHoming(),
}))
