import type { QueryObserverResult } from '@tanstack/svelte-query'

import { SvelteSet } from 'svelte/reactivity'

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

	// Errors that `Section.Error` parts inside the section report, e.g. an inner form's mutation.
	const reported = new SvelteSet<() => Error | null>()

	const errors = $derived.by(() => {
		const mutationErrors = (getSources().mutations ?? []).map((mutation) => mutation.error)
		const reportedErrors = [...reported].map((getError) => getError())
		return dedupeErrors([...queryErrors, ...mutationErrors, ...reportedErrors])
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
		report(getError: () => Error | null) {
			reported.add(getError)
			return () => {
				reported.delete(getError)
			}
		},
	}
}
