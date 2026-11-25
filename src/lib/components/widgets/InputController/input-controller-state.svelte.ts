import type { RefetchInterval } from '$lib/components/refetch-interval-store.svelte'

import { defineResourceState } from '$lib/resource-widget-state'

/** What every widget for one input controller shares below one `WidgetsProvider`. */
interface InputControllerState {
	/**
	 * The rate the Refresh widget picked for `GetEvents`. Undefined while no Refresh widget is
	 * mounted, and `GetEvents` then polls at its own default.
	 */
	eventsRefetchInterval: RefetchInterval | undefined
}

/** Returns the state the input controller widgets naming one `partID` and `resourceName` share. */
export const useInputControllerState = defineResourceState<InputControllerState>(
	'input controller',
	() => {
		const state = $state<InputControllerState>({ eventsRefetchInterval: undefined })
		return state
	}
)
