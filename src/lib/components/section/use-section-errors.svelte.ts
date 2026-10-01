import type { QueryObserverResult } from '@tanstack/svelte-query'

import { errorKey } from './error-key'

/** The slice of a TanStack query result a section reads. Widgets pass the whole result. */
export type SectionQuery = Pick<
	QueryObserverResult,
	'error' | 'fetchStatus' | 'isLoading' | 'isSuccess'
>

/** The slice of a mutation a section reads. Widgets pass the whole mutation. */
export interface SectionMutation {
	error: Error | null
}

/** What a section reads and writes. Its errors show in the section's indicator. */
export interface SectionSources {
	queries?: SectionQuery[]
	mutations?: SectionMutation[]
}

/** The distinct errors in `errors`, in order, first occurrence kept. */
export const dedupeErrors = (errors: (Error | null)[]): Error[] => {
	const present = errors.filter((error) => error !== null)
	return present.filter(
		(error, index) => present.findIndex((seen) => errorKey(seen) === errorKey(error)) === index
	)
}

const serializeErrors = (errors: Error[]) => errors.map((error) => errorKey(error)).join('\0\0')

/**
 * A section's distinct errors across its queries and mutations, and whether its first load is
 * still running.
 *
 * Query errors are held while a query refetches. TanStack resets `error` to null and `status` to
 * pending on every refetch of a query that has no data yet (query-core `fetchState`), so a polled
 * query against a missing resource would otherwise blank and re-show its error each interval. The
 * held errors clear once no query has an error and none is fetching, so a disabled query, which
 * sits idle and never succeeds, does not hold them forever. Errors with the same content keep
 * their identity so the keyed list does not re-render.
 */
export const useSectionErrors = (getSources: () => SectionSources) => {
	let held: Error[] = []

	const queryErrors = $derived.by(() => {
		const queries = getSources().queries ?? []
		const next = dedupeErrors(queries.map((query) => query.error))
		if (next.length > 0) {
			if (serializeErrors(next) !== serializeErrors(held)) {
				held = next
			}
		} else if (queries.every((query) => query.fetchStatus === 'idle')) {
			held = []
		}
		return held
	})

	const errors = $derived.by(() => {
		const mutationErrors = (getSources().mutations ?? []).map((mutation) => mutation.error)
		return dedupeErrors([...queryErrors, ...mutationErrors])
	})

	const isLoading = $derived(
		errors.length === 0 && (getSources().queries ?? []).some((query) => query.isLoading)
	)

	return {
		get errors() {
			return errors
		},
		get isLoading() {
			return isLoading
		},
	}
}
