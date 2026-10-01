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

	/**
	 * What the section reads or writes. At least one list is required, so every section's errors
	 * reach its indicator. Query errors are distinct per query, mutation errors per mutation.
	 */
	type Sources =
		| { queries: SectionQuery[]; mutations?: SectionMutation[] }
		| { queries?: SectionQuery[]; mutations: SectionMutation[] }

	type Props = HTMLAttributes<HTMLElement> &
		Sources & {
			/** RDK method name in PascalCase. */
			method: string
			api: ResourceTriplet
			subheading?: Snippet
			tooltip?: Snippet
			/**
			 * @deprecated Exists only for the migration. Removed once every section passes it.
			 */
			skeleton?: boolean
		}

	const {
		method,
		api,
		queries = [],
		mutations = [],
		subheading,
		tooltip,
		skeleton = false,
		children,
		...rest
	}: Props = $props()

	const sectionErrors = useSectionErrors(() => ({ queries, mutations }))
</script>

<Section
	errorReporter={sectionErrors}
	{...rest}
>
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

	<Section.Body
		isLoading={sectionErrors.isLoading}
		{skeleton}
	>
		{@render children?.()}
	</Section.Body>
</Section>
