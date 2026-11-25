import type { ResourceTriplet } from '#lib/resource-triplet.js'
import type { Snippet } from 'svelte'

import { apiDocsHref } from '#lib/api-docs-href.js'
import { getContext, setContext } from 'svelte'
import { SvelteSet } from 'svelte/reactivity'

import type { SectionErrorReporter } from './section-error-reporter'

import { provideSectionErrorReporter } from './section-error-reporter'
import {
	type SectionMutation,
	type SectionQuery,
	useSectionErrors,
} from './use-section-errors.svelte'

const SECTION_SCOPE_KEY = Symbol('section-scope')
const SECTION_HOST_SCOPE_KEY = Symbol('section-host-scope')

/** The method's description, the docs link's tooltip. Plain text or markup. */
export type SectionDescription = string | Snippet

/** What one contributor, the scope's own props or a section inside it, tells the scope. */
export interface SectionScopeSources {
	/** RDK method name in PascalCase. */
	method?: string
	api?: ResourceTriplet
	description?: SectionDescription
	/** Overrides the docs URL built from `api` and `method`. */
	docsHref?: string
	queries?: SectionQuery[]
	mutations?: SectionMutation[]
}

/** What the parts inside a `Section.Scope` read: the method, its docs, the errors, the first load. */
export interface SectionScope extends SectionErrorReporter {
	readonly method: string | undefined
	readonly api: ResourceTriplet | undefined
	readonly description: SectionDescription | undefined
	readonly docsHref: string | undefined
	/** Distinct errors across every query, mutation, and reported error in the scope. */
	readonly errors: Error[]
	/** True on the first load only: a query is loading and no error is held. */
	readonly isLoading: boolean
	/**
	 * Adds a section's method, queries, and mutations to the scope. The scope's own props win
	 * over a registered method, API, description, or docs URL. Returns a function that removes it.
	 */
	register: (getSources: () => SectionScopeSources) => () => void
}

// Method names are the camelCase form of the PascalCase heading (GetPosition → getPosition).
const methodDocsHref = (api: ResourceTriplet, method: string) =>
	apiDocsHref(api, method.charAt(0).toLowerCase() + method.slice(1))

export const createSectionScope = (getOwn: () => SectionScopeSources): SectionScope => {
	const registered = new SvelteSet<() => SectionScopeSources>()

	const contributors = $derived([getOwn(), ...[...registered].map((getSources) => getSources())])

	const sectionErrors = useSectionErrors(() => ({
		queries: contributors.flatMap((sources) => sources.queries ?? []),
		mutations: contributors.flatMap((sources) => sources.mutations ?? []),
	}))

	const method = $derived(contributors.find((sources) => sources.method)?.method)
	const api = $derived(contributors.find((sources) => sources.api)?.api)
	const description = $derived(contributors.find((sources) => sources.description)?.description)
	const docsHref = $derived.by(() => {
		const explicit = contributors.find((sources) => sources.docsHref)?.docsHref
		if (explicit) return explicit
		return api && method ? methodDocsHref(api, method) : undefined
	})

	return {
		get method() {
			return method
		},
		get api() {
			return api
		},
		get description() {
			return description
		},
		get docsHref() {
			return docsHref
		},
		get errors() {
			return sectionErrors.errors
		},
		get isLoading() {
			return sectionErrors.isLoading
		},
		report: sectionErrors.report,
		register(getSources) {
			registered.add(getSources)
			return () => {
				registered.delete(getSources)
			}
		},
	}
}

/**
 * Makes `scope` the nearest scope for the parts below. A `Section.Error` below reports into it
 * unless a `Section` in between collects errors itself.
 */
export const provideSectionScope = (scope: SectionScope) => {
	setContext(SECTION_SCOPE_KEY, scope)
	provideSectionErrorReporter(() => scope)
	return scope
}

/** The nearest `Section.Scope`, or undefined outside one. */
export const useSectionScope = () => getContext<SectionScope | undefined>(SECTION_SCOPE_KEY)

/** Provides `scope` as a host's scope, the one an `ApiSection` below lifts its heading into. */
export const provideSectionHostScope = (scope: SectionScope) => {
	setContext(SECTION_HOST_SCOPE_KEY, scope)
	return provideSectionScope(scope)
}

/**
 * The host scope above, for an `ApiSection` to lift its heading into. Hides it from everything
 * below, so a section nested in this one keeps its own heading row.
 */
export const claimSectionHostScope = () => {
	const host = getContext<SectionScope | undefined>(SECTION_HOST_SCOPE_KEY)
	setContext(SECTION_HOST_SCOPE_KEY, undefined)
	return host
}
