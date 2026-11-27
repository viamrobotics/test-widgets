import { untrack } from 'svelte'

/**
 * The status text a board control's named rows report, oldest first. `text` is the latest entry,
 * or an empty string when no row reports any.
 */
export const createBoardStatusReports = () => {
	let reports = $state<{ name: string; text: string }[]>([])

	const text = $derived(reports.at(-1)?.text ?? '')

	return {
		get text() {
			return text
		},
		/** Records `name`'s text. An empty string drops that row's entry. */
		report(name: string, rowText: string) {
			// Rows report from effects, so this write must not subscribe the calling effect to `reports`.
			const others = untrack(() => reports).filter((entry) => entry.name !== name)
			reports = rowText === '' ? others : [...others, { name, text: rowText }]
		},
	}
}
