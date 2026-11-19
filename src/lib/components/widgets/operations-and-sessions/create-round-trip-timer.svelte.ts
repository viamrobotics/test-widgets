import { type QueryCacheNotifyEvent, useQueryClient } from '@tanstack/svelte-query'

interface RoundTripTimer {
	/** The last completed round trip in ms, or 0 before the first one completes. */
	readonly current: number
}

/**
 * Times each fetch of one robot query, from the cache's `fetch` action to its `success`.
 *
 * The svelte-sdk does not export the robot query key, so a query matches when its key
 * holds both the part ID and the method name, which every robot query key does.
 */
export const createRoundTripTimer = (partID: () => string, methodName: string): RoundTripTimer => {
	const queryClient = useQueryClient()
	let current = $state(0)

	// Pre, so the listener is in place before the query's own effect starts the first fetch.
	$effect.pre(() => {
		const currentPartID = partID()
		let startedAt: number | undefined

		const isTimedQuery = (event: QueryCacheNotifyEvent) =>
			event.query.queryKey.includes(currentPartID) && event.query.queryKey.includes(methodName)

		return queryClient.getQueryCache().subscribe((event) => {
			if (event.type !== 'updated' || !isTimedQuery(event)) {
				return
			}
			const { action } = event
			if (action.type === 'fetch') {
				startedAt = performance.now()
			} else if (action.type === 'error') {
				startedAt = undefined
			} else if (action.type === 'success' && !action.manual && startedAt !== undefined) {
				current = performance.now() - startedAt
				startedAt = undefined
			}
		})
	})

	return {
		get current() {
			return current
		},
	}
}
