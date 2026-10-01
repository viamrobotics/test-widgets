import { SvelteMap } from 'svelte/reactivity'

interface EditedTarget {
	value: number
	/** The live value when the user last edited this field. */
	baseline: number
}

/**
 * Targets for an editor whose untouched fields follow a live reading. Editing a
 * field pins it to the user's value and records the live value at that moment,
 * so later readings can tell how far the arm has moved since.
 */
export class EditedTargets<TKey> {
	readonly #edits = new SvelteMap<TKey, EditedTarget>()
	readonly #readLive: (key: TKey) => number
	readonly #driftThreshold: (key: TKey) => number

	constructor(readLive: (key: TKey) => number, driftThreshold: (key: TKey) => number) {
		this.#readLive = readLive
		this.#driftThreshold = driftThreshold
	}

	/** The user's value for an edited field, otherwise the live value. */
	target(key: TKey): number {
		return this.#edits.get(key)?.value ?? this.#readLive(key)
	}

	isEdited(key: TKey): boolean {
		return this.#edits.has(key)
	}

	/**
	 * How far the live value has moved since the field was last edited, or
	 * `undefined` when the field is not edited or the move is within the threshold.
	 */
	drift(key: TKey): number | undefined {
		const edit = this.#edits.get(key)
		if (!edit) return undefined

		const distance = Math.abs(this.#readLive(key) - edit.baseline)
		return distance > this.#driftThreshold(key) ? distance : undefined
	}

	edit(key: TKey, value: number) {
		this.#edits.set(key, { value, baseline: this.#readLive(key) })
	}

	reset(key: TKey) {
		this.#edits.delete(key)
	}

	resetAll() {
		this.#edits.clear()
	}
}
