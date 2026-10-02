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
		/** RDK method name in PascalCase. */
		method: string
		api: ResourceTriplet
		queries?: SectionQuery[]
		mutations?: SectionMutation[]
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

<Section {...rest}>
	<div class="flex flex-col gap-0.5">
		<Section.Heading>
			<Section.Method
				{method}
				{api}
			/>
			{#snippet aside()}
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

	<Section.Errors errors={sectionErrors.errors} />
</Section>
