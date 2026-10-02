import { getContext, setContext } from 'svelte'

const SECTION_ERROR_REPORTER_KEY = Symbol('section-error-reporter')

/** Lets a part inside a section add an error to the section's indicator. */
export interface SectionErrorReporter {
	/** Adds the error `getError` returns to the section's errors. Returns a function that removes it. */
	report: (getError: () => Error | null) => () => void
}

export const provideSectionErrorReporter = (
	getReporter: () => SectionErrorReporter | undefined
) => {
	setContext(SECTION_ERROR_REPORTER_KEY, getReporter)
}

/** The enclosing section's reporter, or undefined outside a section that shows errors. */
export const useSectionErrorReporter = () =>
	getContext<(() => SectionErrorReporter | undefined) | undefined>(SECTION_ERROR_REPORTER_KEY)
