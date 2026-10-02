import type { QueryObserverResult } from '@tanstack/svelte-query'

import { errorKey } from './error-key'

export type SectionQuery = Pick<
	QueryObserverResult,
	'error' | 'fetchStatus' | 'isLoading' | 'isSuccess'
>

export interface SectionMutation {
	error: Error | null
}

export interface SectionSources {
	queries?: SectionQuery[]
	mutations?: SectionMutation[]
}

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
