import { createInFlightGuard, type InFlightGuard } from '$lib/components/in-flight-guard.svelte'
import { defineResourceState } from '$lib/resource-widget-state'

/** What every widget for one switch shares below one `WidgetsProvider`. */
interface SwitchState {
	/**
	 * Every call that sets the position. Two position picks in flight would contradict each other,
	 * so they share one group. The queries stay live.
	 */
	position: InFlightGuard
}

/** Returns the state the switch widgets naming one `partID` and `resourceName` share. */
export const useSwitchState = defineResourceState<SwitchState>('switch', () => ({
	position: createInFlightGuard(),
}))
