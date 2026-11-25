import { createHoldCancelSignal, type HoldCancelSignal } from '$lib/components/hold-cancel-signal'
import { createInFlightGuard, type InFlightGuard } from '$lib/components/in-flight-guard.svelte'
import { defineResourceState } from '$lib/resource-widget-state'

import { type ArmJogSteps, createArmJogSteps } from './arm-jog-steps.svelte'

/** What every widget for one arm shares below one `WidgetsProvider`. */
interface ArmState {
	/**
	 * Every call that moves the arm: Jog's steps and holds, Joints' steps, holds, Zero, and Home,
	 * MoveToPosition, and MoveToJointPositions. Stop is in no group, so it always sends.
	 */
	motion: InFlightGuard
	/** ManualMode's Enter and Exit, and SetManualMode's Execute. */
	manualMode: InFlightGuard
	/** The step sizes Jog and Joints both read at each press. */
	jogSteps: ArmJogSteps
	/** Stop raises it, and Jog and Joints end any hold in progress on it. */
	holdCancel: HoldCancelSignal
}

/** Returns the state the arm widgets naming one `partID` and `resourceName` share. */
export const useArmState = defineResourceState<ArmState>('arm', () => ({
	motion: createInFlightGuard(),
	manualMode: createInFlightGuard(),
	jogSteps: createArmJogSteps(),
	holdCancel: createHoldCancelSignal(),
}))
