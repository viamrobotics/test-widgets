import { createInFlightGuard, type InFlightGuard } from '#lib/components/in-flight-guard.svelte.js'
import { defineResourceState } from '#lib/resource-widget-state.js'

/** What every widget for one base shares below one `WidgetsProvider`. */
interface BaseState {
	/**
	 * Every call that commands the base's motion: QuickMove's drive, MoveStraight, Spin, SetPower,
	 * and SetVelocity. Each replaces or contradicts the others. A zero power from QuickMove's
	 * release and Stop are in no group, so they always send.
	 */
	motion: InFlightGuard
}

/** Returns the state the base widgets naming one `partID` and `resourceName` share. */
export const useBaseState = defineResourceState<BaseState>('base', () => ({
	motion: createInFlightGuard(),
}))
