import { getContext, setContext } from 'svelte'

const key = Symbol('resource-dependencies-context')

/**
 * Names of the resources `resourceName` on `partID` can reach, or `undefined` when the host
 * cannot tell. Reactive state read inside it re-filters the widgets that call it.
 */
export type GetResourceDependencies = (
	partID: string,
	resourceName: string
) => readonly string[] | undefined

export const createResourceDependenciesContext = (getDependencies: GetResourceDependencies) => {
	setContext(key, getDependencies)
}

/** Falls back to "unknown" because the context is provided in userland outside the SDK. */
export const useResourceDependencies = (): GetResourceDependencies =>
	getContext<GetResourceDependencies | undefined>(key) ?? (() => undefined)
