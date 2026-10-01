<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLAttributes } from 'svelte/elements'

	import type { ResourceTriplet } from '$lib/resource-triplet'

	import { Section } from './section'
	import {
		type SectionMutation,
		type SectionQuery,
		useSectionErrors,
	} from './section/use-section-errors.svelte'

	interface Props extends HTMLAttributes<HTMLElement> {
		/** RDK method name in PascalCase, rendered verbatim in mono and linked to its docs. */
		method: string
		/** The resource API the method belongs to, e.g. `ResourceTriplets.Arm`. */
		api: ResourceTriplet
		/** The queries this section reads. Their distinct errors show in the heading's indicator. */
		queries?: SectionQuery[]
		/** The mutations this section sends. Their errors show in the heading's indicator. */
		mutations?: SectionMutation[]
		/** Content under the heading, e.g. a `Section.Text` line or a control that belongs to it. */
		subheading?: Snippet
		/** Content of the info tooltip beside the heading. */
		tooltip?: Snippet
	}

	const {
		method,
		api,
		queries = [],
		mutations = [],
		subheading,
		tooltip,
		children,
		...rest
	}: Props = $props()

	const sectionErrors = useSectionErrors(() => ({ queries, mutations }))
</script>

<Section {...rest}>
	<div class="flex flex-col gap-0.5">
		<Section.Heading>
			<Section.Method
				{method}
				{api}
			/>
			{#snippet aside()}
				<Section.Errors errors={sectionErrors.errors} />
				{#if tooltip}
					<Section.Tooltip>{@render tooltip()}</Section.Tooltip>
				{/if}
			{/snippet}
		</Section.Heading>
		{@render subheading?.()}
	</div>

	<Section.Body isLoading={sectionErrors.isLoading}>
		{@render children?.()}
	</Section.Body>
</Section>
