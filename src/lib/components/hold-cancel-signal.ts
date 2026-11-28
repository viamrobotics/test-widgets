/** Lets a resource's Stop end every hold in progress in its sibling widgets, with no prop wiring. */
export interface HoldCancelSignal {
	/** Ends every hold in progress. Stop calls it before it sends. */
	raise(): void
	/**
	 * Calls `onCancel` on each raise until the returned function runs. Subscribe inside `$effect`
	 * and return the unsubscribe as its teardown.
	 */
	subscribe(onCancel: () => void): () => void
}

/** Creates a signal with no subscribers. */
export const createHoldCancelSignal = (): HoldCancelSignal => {
	const listeners = new Set<() => void>()
	return {
		raise() {
			for (const onCancel of listeners) onCancel()
		},
		subscribe(onCancel) {
			listeners.add(onCancel)
			return () => {
				listeners.delete(onCancel)
			}
		},
	}
}
