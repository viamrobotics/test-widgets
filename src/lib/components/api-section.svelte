<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLAttributes } from 'svelte/elements'

	import { untrack } from 'svelte'

	import type { ResourceTriplet } from '$lib/resource-triplet'

	import type { SectionMutation, SectionQuery } from './section/use-section-errors.svelte'

	import { Section } from './section'
	import {
		claimSectionHostScope,
		createSectionScope,
		provideSectionScope,
		type SectionScopeSources,
	} from './section/section-scope-context.svelte'

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

	const getSources = (): SectionScopeSources => ({
		method,
		api,
		description: tooltip,
		queries,
		mutations,
	})

	// Inside a host's `Section.Scope`, the host's header draws the method, docs, and errors.
	const hostScope = claimSectionHostScope()
	const isUnderHostHeader = hostScope !== undefined
	const scope = hostScope ?? provideSectionScope(createSectionScope(getSources))

	$effect(() => {
		// Registering writes the scope's contributors, so it must not subscribe this effect to them.
		return untrack(() => hostScope?.register(getSources))
	})
</script>

<Section
	errorReporter={scope}
	{...rest}
>
	{#if !isUnderHostHeader}
		<div class="flex flex-col gap-0.5">
			<Section.Heading>
				<Section.Method
					{method}
					{api}
				/>
				{#snippet aside()}
					<Section.Errors />
					{#if tooltip}
						<Section.Tooltip>{@render tooltip()}</Section.Tooltip>
					{/if}
				{/snippet}
			</Section.Heading>
			{@render subheading?.()}
		</div>
	{/if}

	<!-- The host's `Section.Loading` is the bar under its header, so the controls stay drawn. -->
	<Section.Body
		isLoading={scope.isLoading}
		skeleton={skeleton || isUnderHostHeader}
	>
		{@render children?.()}
	</Section.Body>
</Section>
