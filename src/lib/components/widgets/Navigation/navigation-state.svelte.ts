import { createInFlightGuard, type InFlightGuard } from '$lib/components/in-flight-guard.svelte'
import { defineResourceState } from '$lib/resource-widget-state'

/** What every widget for one navigation service shares below one `WidgetsProvider`. */
interface NavigationState {
	/**
	 * Every call that sets the navigation mode: SetMode's Execute and Mode's presses. Two of them on
	 * one service would contradict each other, so they share one group. AddWaypoint, RemoveWaypoint,
	 * and the Map's waypoint add and remove are in no group, and the queries stay live.
	 */
	mode: InFlightGuard
}

/** Returns the state the navigation widgets naming one `partID` and `resourceName` share. */
export const useNavigationState = defineResourceState<NavigationState>('navigation', () => ({
	mode: createInFlightGuard(),
}))
