import { getContext, setContext } from 'svelte'

const PROVIDER_KEY = Symbol('resource-widget-state')

/** Identifies one mounted `WidgetsProvider`. Each resource's states live as long as it does. */
type ProviderToken = object

/**
 * Mounts the shared state every widget below reads. `WidgetsProvider` calls it, once per page.
 * Call it during component setup.
 */
export const provideWidgetState = (): void => {
	setContext<ProviderToken>(PROVIDER_KEY, {})
}

/**
 * Returns the shared state for one resource, read by every widget that names the same
 * `partID` and `resourceName` below one `WidgetsProvider`, wherever each widget renders.
 */
type UseResourceState<TState> = (partID: string, resourceName: string) => TState

/**
 * Declares the state one resource's widgets share, such as conflict-group guards and settings two
 * widgets must agree on. Call it once, at module level, in the resource's state module.
 *
 * @param create Runs once per `(partID, resourceName)` per provider, on the first widget's setup.
 *   Hold only `$state` in what it returns. A `$derived` or `$effect` made there would belong to
 *   the first widget and stop when that widget unmounts, while the state outlives it.
 * @returns The hook the resource's widgets call during component setup.
 * @throws From the hook, when no `WidgetsProvider` sits above the calling widget.
 */
export const defineResourceState = <TState>(
	resourceLabel: string,
	create: () => TState
): UseResourceState<TState> => {
	const statesByProvider = new WeakMap<ProviderToken, Map<string, TState>>()

	return (partID, resourceName) => {
		const provider = getContext<ProviderToken | undefined>(PROVIDER_KEY)
		if (!provider) {
			throw new Error(
				`The ${resourceLabel} widget for "${resourceName}" needs a <WidgetsProvider> above it. Wrap the page once in <WidgetsProvider>, imported from @viamrobotics/test-widgets.`
			)
		}

		let states = statesByProvider.get(provider)
		if (!states) {
			states = new Map()
			statesByProvider.set(provider, states)
		}

		// The NUL separator cannot occur in a part ID or a resource name, so two pairs never share a key.
		const key = `${partID}\u0000${resourceName}`
		let state = states.get(key)
		if (state === undefined) {
			state = create()
			states.set(key, state)
		}
		return state
	}
}
