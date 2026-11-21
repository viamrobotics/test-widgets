/** How a guarded call ended. */
export type InFlightOutcome = 'succeeded' | 'failed'

/**
 * One conflict group's guard. Mutations that duplicate or contradict each other share one guard,
 * so only one of them is ever in flight. A press made while the group is busy is dropped, never
 * stored, so nothing fires later without a press at that moment.
 */
export interface InFlightGuard {
	/** True while a call in this group is in flight. Bind the group's controls' disabled state to it. */
	readonly isBusy: boolean
	/**
	 * Runs `mutation` when the group is idle and holds the group until it settles, success or
	 * failure. Called while the group is busy, it sends nothing and returns `undefined`.
	 *
	 * @returns How the call ended. The promise never rejects. The mutation's own state carries the
	 *   error, so pass a call such as `mutation.mutateAsync(args)` whose failure the section reports.
	 */
	run: (mutation: () => Promise<unknown>) => Promise<InFlightOutcome> | undefined
}

/** Creates one conflict group's guard. Call it during component setup, one per group. */
export const createInFlightGuard = (): InFlightGuard => {
	let isBusy = $state(false)

	const run = (mutation: () => Promise<unknown>) => {
		if (isBusy) {
			return undefined
		}
		isBusy = true
		// The executor runs synchronously, so a mutation that throws before returning still releases the group.
		const call = new Promise<unknown>((resolve) => {
			resolve(mutation())
		})
		return call
			.then(
				(): InFlightOutcome => 'succeeded',
				(): InFlightOutcome => 'failed'
			)
			.finally(() => {
				isBusy = false
			})
	}

	return {
		get isBusy() {
			return isBusy
		},
		run,
	}
}
