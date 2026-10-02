import SectionBody from './section-body.svelte'
import SectionErrors from './section-errors.svelte'
import SectionHeading from './section-heading.svelte'
import SectionMethod from './section-method.svelte'
import SectionPlaceholder from './section-placeholder.svelte'
import SectionText from './section-text.svelte'
import SectionTooltip from './section-tooltip.svelte'
import Root from './section.svelte'

export { useSectionLoading } from './section-loading'

export const Section: typeof Root & {
	Body: typeof SectionBody
	Errors: typeof SectionErrors
	Heading: typeof SectionHeading
	Method: typeof SectionMethod
	Placeholder: typeof SectionPlaceholder
	Text: typeof SectionText
	Tooltip: typeof SectionTooltip
} = Object.assign(Root, {
	Body: SectionBody,
	Errors: SectionErrors,
	Heading: SectionHeading,
	Method: SectionMethod,
	Placeholder: SectionPlaceholder,
	Text: SectionText,
	Tooltip: SectionTooltip,
})
