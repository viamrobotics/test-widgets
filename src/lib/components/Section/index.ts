import Root from './Section.svelte'
import SectionBody from './SectionBody.svelte'
import SectionError from './SectionError.svelte'
import SectionErrors from './SectionErrors.svelte'
import SectionHeading from './SectionHeading.svelte'
import SectionMethod from './SectionMethod.svelte'
import SectionPlaceholder from './SectionPlaceholder.svelte'
import SectionText from './SectionText.svelte'
import SectionTooltip from './SectionTooltip.svelte'

export { useSectionLoading } from './section-loading'
export {
	dedupeErrors,
	useSectionErrors,
	type SectionMutation,
	type SectionQuery,
	type SectionSources,
} from './use-section-errors.svelte'

export const Section: typeof Root & {
	Body: typeof SectionBody
	Error: typeof SectionError
	Errors: typeof SectionErrors
	Heading: typeof SectionHeading
	Method: typeof SectionMethod
	Placeholder: typeof SectionPlaceholder
	Text: typeof SectionText
	Tooltip: typeof SectionTooltip
} = Object.assign(Root, {
	Body: SectionBody,
	Error: SectionError,
	Errors: SectionErrors,
	Heading: SectionHeading,
	Method: SectionMethod,
	Placeholder: SectionPlaceholder,
	Text: SectionText,
	Tooltip: SectionTooltip,
})
