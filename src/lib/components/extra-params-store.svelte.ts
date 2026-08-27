import { PersistedState } from 'runed'

import { parseExtraParams } from './parse-extra-params'

export interface ExtraParamsStore {
	/** Raw JSON text shown in the editor. */
	text: string
	/** Last valid parsed params, or undefined when the field is empty. */
	readonly current: Record<string, unknown> | undefined
	/** Parse error for the current text, if any. */
	readonly error: Error | undefined
}

// create a persisted store for the specified partID + resourceName + scope.
// Scope should name the API method (e.g. 'camera-getImages') since extra
// semantics are method-specific.
export const createExtraParamsStore = (
	partID: () => string,
	resourceName: () => string,
	scope: string
): ExtraParamsStore => {
	const key = $derived(`control-card-extra-params/${partID()}/${resourceName()}/${scope}`)

	const persisted = $derived(new PersistedState<string>(key, ''))

	const parsed = $derived.by(() => parseExtraParams(persisted.current))

	// Queries keep the last valid params while the user types through an
	// invalid intermediate state, instead of briefly refetching without extra.
	let committed = $state<{ key: string; text: string } | undefined>()

	const current = $derived.by(() => {
		const text = committed?.key === key ? committed.text : persisted.current
		return parseExtraParams(text).params
	})

	return {
		get text() {
			return persisted.current
		},
		set text(value: string) {
			persisted.current = value
			if (parseExtraParams(value).error === undefined) {
				committed = { key, text: value }
			}
		},
		get current() {
			return current
		},
		get error() {
			return parsed.error
		},
	}
}
