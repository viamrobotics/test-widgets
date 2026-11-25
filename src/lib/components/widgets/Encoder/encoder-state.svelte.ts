import { createInFlightGuard, type InFlightGuard } from '$lib/components/in-flight-guard.svelte'
import { defineResourceState } from '$lib/resource-widget-state'

/** What every widget for one encoder shares below one `WidgetsProvider`. */
interface EncoderState {
	/**
	 * Every call that zeroes the position. A second reset would zero a position the person never
	 * saw, so a reset never queues. The queries stay live.
	 */
	reset: InFlightGuard
}

/** Returns the state the encoder widgets naming one `partID` and `resourceName` share. */
export const useEncoderState = defineResourceState<EncoderState>('encoder', () => ({
	reset: createInFlightGuard(),
}))
