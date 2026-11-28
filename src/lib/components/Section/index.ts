import Root from './Section.svelte'
import SectionBody from './SectionBody.svelte'
import SectionDocs from './SectionDocs.svelte'
import SectionError from './SectionError.svelte'
import SectionErrors from './SectionErrors.svelte'
import SectionHeading from './SectionHeading.svelte'
import SectionLoading from './SectionLoadingBar.svelte'
import SectionMethod from './SectionMethod.svelte'
import SectionScope from './SectionScope.svelte'
import SectionText from './SectionText.svelte'
import SectionTooltip from './SectionTooltip.svelte'

export {
	useSectionScope,
	type SectionDescription,
	type SectionScope,
	type SectionScopeSources,
} from './section-scope-context.svelte'
export {
	dedupeErrors,
	useSectionErrors,
	type SectionMutation,
	type SectionQuery,
	type SectionSources,
} from './use-section-errors.svelte'

export const Section: typeof Root & {
	Body: typeof SectionBody
	Docs: typeof SectionDocs
	Error: typeof SectionError
	Errors: typeof SectionErrors
	Heading: typeof SectionHeading
	Loading: typeof SectionLoading
	Method: typeof SectionMethod
	Scope: typeof SectionScope
	Text: typeof SectionText
	Tooltip: typeof SectionTooltip
} = Object.assign(Root, {
	Body: SectionBody,
	Docs: SectionDocs,
	Error: SectionError,
	Errors: SectionErrors,
	Heading: SectionHeading,
	Loading: SectionLoading,
	Method: SectionMethod,
	Scope: SectionScope,
	Text: SectionText,
	Tooltip: SectionTooltip,
})
