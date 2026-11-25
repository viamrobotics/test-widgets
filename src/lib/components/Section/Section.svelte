<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLAttributes } from 'svelte/elements'

	import { provideSectionErrorReporter, type SectionErrorReporter } from './section-error-reporter'

	interface Props extends HTMLAttributes<HTMLElement> {
		children: Snippet
		/** Collects errors that `Section.Error` parts inside the section report, e.g. `useSectionErrors`' result. */
		errorReporter?: SectionErrorReporter
	}

	const { children, errorReporter, class: className, ...rest }: Props = $props()

	provideSectionErrorReporter(() => errorReporter)
</script>

<section
	class={['flex p-4', className]}
	{...rest}
>
	{@render children()}
</section>
