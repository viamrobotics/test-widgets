import type { QueryObserverResult } from '@tanstack/svelte-query'

/** The slice of a TanStack result a section reads. Widgets pass the whole result. */
export type SectionQuery = Pick<QueryObserverResult, 'error' | 'isLoading' | 'isSuccess'>

/** Two errors with the same name and message read as one error. */
export const queryErrorKey = (error: Error) => `${error.name}\0${error.message}`

/** The distinct errors across `queries`, in query order, first occurrence kept. */
export const dedupeQueryErrors = (queries: SectionQuery[]): Error[] => {
	const errors = queries.map((query) => query.error).filter((error) => error !== null)
	return errors.filter(
		(error, index) =>
			errors.findIndex((seen) => queryErrorKey(seen) === queryErrorKey(error)) === index
	)
}

const serializeErrors = (errors: Error[]) =>
	errors.map((error) => queryErrorKey(error)).join('\0\0')

/**
 * The distinct errors across a set of queries, held while a query refetches.
 *
 * TanStack resets `error` to null and `status` to pending on every refetch of a query that has
 * no data yet (query-core `fetchState`), so a polled query against a missing resource would
 * otherwise blank and re-show its error each interval. The held errors clear once every query
 * succeeds. Errors with the same content keep their identity so the keyed list does not
 * re-render.
 */
export const useQueryErrors = (getQueries: () => SectionQuery[]) => {
	let held: Error[] = []

	const errors = $derived.by(() => {
		const queries = getQueries()
		const next = dedupeQueryErrors(queries)
		if (next.length > 0) {
			if (serializeErrors(next) !== serializeErrors(held)) {
				held = next
			}
		} else if (queries.every((query) => query.isSuccess)) {
			held = []
		}
		return held
	})

	return {
		get current() {
			return errors
		},
	}
}
