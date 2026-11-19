import SectionBody from './section-body.svelte'
import SectionDocs from './section-docs.svelte'
import SectionError from './section-error.svelte'
import SectionErrors from './section-errors.svelte'
import SectionHeading from './section-heading.svelte'
import SectionLoading from './section-loading-bar.svelte'
import SectionMethod from './section-method.svelte'
import SectionPlaceholder from './section-placeholder.svelte'
import SectionScope from './section-scope.svelte'
import SectionText from './section-text.svelte'
import SectionTooltip from './section-tooltip.svelte'
import Root from './section.svelte'

export { useSectionLoading } from './section-loading'
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
	Placeholder: typeof SectionPlaceholder
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
	Placeholder: SectionPlaceholder,
	Scope: SectionScope,
	Text: SectionText,
	Tooltip: SectionTooltip,
})
