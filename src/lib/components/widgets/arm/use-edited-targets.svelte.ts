import { SvelteMap } from 'svelte/reactivity'

interface EditedTarget {
	value: number
	baseline: number
}

export interface EditedTargets<TKey> {
	target: (key: TKey) => number
	isEdited: (key: TKey) => boolean
	drift: (key: TKey) => number | undefined
	edit: (key: TKey, value: number) => void
	reset: (key: TKey) => void
	resetAll: () => void
}

export const useEditedTargets = <TKey>(
	readLive: (key: TKey) => number,
	driftThreshold: (key: TKey) => number
): EditedTargets<TKey> => {
	const edits = new SvelteMap<TKey, EditedTarget>()

	return {
		target: (key) => edits.get(key)?.value ?? readLive(key),
		isEdited: (key) => edits.has(key),
		drift: (key) => {
			const edit = edits.get(key)
			if (!edit) return undefined

			const distance = Math.abs(readLive(key) - edit.baseline)
			return distance > driftThreshold(key) ? distance : undefined
		},
		edit: (key, value) => {
			edits.set(key, { value, baseline: readLive(key) })
		},
		reset: (key) => {
			edits.delete(key)
		},
		resetAll: () => {
			edits.clear()
		},
	}
}
