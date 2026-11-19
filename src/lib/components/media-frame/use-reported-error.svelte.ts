import { untrack } from 'svelte'

import { useSectionErrorReporter } from '../section/section-error-reporter'

/**
 * Reports `getError`'s error to the enclosing section's indicator for as long as the calling
 * component is mounted. Call it during component init. Outside a section it does nothing.
 */
export const useReportedError = (getError: () => Error | null) => {
	const getReporter = useSectionErrorReporter()
	const reporter = $derived(getReporter?.())

	$effect(() => {
		const current = reporter
		// Registering writes the section's error set, so it must not subscribe this effect to it.
		return untrack(() => current?.report(getError))
	})
}
