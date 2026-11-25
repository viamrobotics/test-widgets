import { createInFlightGuard, type InFlightGuard } from '#lib/components/in-flight-guard.svelte.js'
import { defineResourceState } from '#lib/resource-widget-state.js'

/** What every widget for one gripper shares below one `WidgetsProvider`. */
interface GripperState {
	/**
	 * Every call that moves the gripper: OpenGrab's Open and Grab, Open, Grab, and GoToInputs. Open
	 * and Grab contradict each other, and an input goal contradicts both. Stop is in no group, so it
	 * always sends.
	 */
	motion: InFlightGuard
}

/** Returns the state the gripper widgets naming one `partID` and `resourceName` share. */
export const useGripperState = defineResourceState<GripperState>('gripper', () => ({
	motion: createInFlightGuard(),
}))
