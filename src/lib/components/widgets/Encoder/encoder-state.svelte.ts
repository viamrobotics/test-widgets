import {
	createInFlightGuard,
	type InFlightGuard,
	type InFlightOutcome,
} from '#lib/components/in-flight-guard.svelte.js'
import { defineResourceState } from '#lib/resource-widget-state.js'

/** What every widget for one encoder shares below one `WidgetsProvider`. */
interface EncoderState {
	/**
	 * Every call that zeroes the position. A second reset would zero a position the person never
	 * saw, so a reset never queues. The queries stay live.
	 */
	readonly reset: InFlightGuard
	/**
	 * How the last reset ended, whichever widget sent it. `undefined` before the first reset and
	 * while one is in flight.
	 */
	readonly lastResetOutcome: InFlightOutcome | undefined
	/**
	 * Sends a reset through the `reset` group and records how it ended.
	 *
	 * @returns What `InFlightGuard.run` returns, so `undefined` means the group was busy.
	 */
	runReset: (mutation: () => Promise<unknown>) => Promise<InFlightOutcome> | undefined
}

/** Returns the state the encoder widgets naming one `partID` and `resourceName` share. */
export const useEncoderState = defineResourceState<EncoderState>('encoder', () => {
	const reset = createInFlightGuard()
	let lastResetOutcome = $state<InFlightOutcome>()

	return {
		reset,
		get lastResetOutcome() {
			return lastResetOutcome
		},
		runReset: (mutation) => {
			const outcome = reset.run(() => {
				lastResetOutcome = undefined
				return mutation()
			})
			void outcome?.then((result) => {
				lastResetOutcome = result
			})
			return outcome
		},
	}
})
