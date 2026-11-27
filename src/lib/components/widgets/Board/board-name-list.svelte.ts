import { PersistedState } from 'runed'
import { untrack } from 'svelte'

/** The kinds of name a board control keeps, as its storage key spells each. */
type BoardNameKind = 'pins' | 'analog-readers' | 'digital-interrupts'

/**
 * The names one board control keeps for one board, saved in local storage under
 * `board-controls/<partID>/<resourceName>/<kind>`. The seed fills the list only when nothing is
 * stored under that key, so a saved list wins over it. Call during component init.
 */
export const useBoardNameList = (
	getPartId: () => string,
	getResourceName: () => string,
	kind: BoardNameKind,
	getSeed: () => string[] = () => []
) => {
	const key = $derived(`board-controls/${getPartId()}/${getResourceName()}/${kind}`)
	const persisted = $derived(new PersistedState<string[]>(key, untrack(getSeed)))

	return {
		get names(): string[] {
			return persisted.current
		},
		/** Adds the trimmed name. A blank or listed name adds nothing and returns false. */
		add(draft: string): boolean {
			const name = draft.trim()
			if (name === '' || persisted.current.includes(name)) return false
			persisted.current = [...persisted.current, name]
			return true
		},
		remove(name: string) {
			persisted.current = persisted.current.filter((existing) => existing !== name)
		},
	}
}
