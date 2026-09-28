<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLAttributes } from 'svelte/elements'

	import type { ResourceTriplet } from '$lib/resource-triplet'

	import Boundary from './boundary.svelte'
	import ErrorIndicator from './error-indicator.svelte'
	import Progress from './progress.svelte'
	import SectionHeading from './section-heading.svelte'
	import { queryErrorKey, type SectionQuery, useQueryErrors } from './use-query-errors.svelte'

	interface Props extends HTMLAttributes<HTMLElement> {
		/** RDK method name, rendered verbatim in mono and linked to its docs through `api`. */
		method?: string | undefined
		/** RDK API string, e.g. "rdk:component:camera". */
		api?: ResourceTriplet | undefined
		/** The queries this section reads. Their distinct errors show in the heading's indicator. */
		queries?: SectionQuery[]
		/** The last error of the mutation this section sends, shown in the heading's indicator. */
		lastError?: Error | null
		/** Heading for a section that is not one method. Ignored when `method` is set. */
		heading?: Snippet
		subheading?: Snippet
		/** Rendered under the description, for a control that belongs to the heading. */
		input?: Snippet
		tooltip?: Snippet
		description?: Snippet
		children?: Snippet
	}

	const {
		method,
		api,
		queries = [],
		lastError = null,
		class: className,
		heading,
		subheading,
		input,
		tooltip,
		description,
		children,
		...rest
	}: Props = $props()

	const queryErrors = useQueryErrors(() => queries)
	const errors = $derived.by(() => {
		const held = queryErrors.current
		if (lastError === null) {
			return held
		}
		const key = queryErrorKey(lastError)
		return held.some((error) => queryErrorKey(error) === key) ? held : [...held, lastError]
	})
	const hasHeading = $derived(method !== undefined || heading !== undefined)
	const isInitialLoad = $derived(errors.length === 0 && queries.some((query) => query.isLoading))
</script>

<section
	class={['flex p-4', className]}
	{...rest}
>
	{#if hasHeading}
		<div class="flex flex-col gap-0.5">
			<SectionHeading
				{method}
				{api}
				{heading}
				{tooltip}
			>
				{#snippet aside()}
					<ErrorIndicator {errors} />
				{/snippet}
			</SectionHeading>
			{#if subheading}
				<p class="text-subtle-2 text-xs">{@render subheading()}</p>
			{/if}
			{@render input?.()}
		</div>
	{:else if errors.length > 0}
		<div class="flex">
			<ErrorIndicator {errors} />
		</div>
	{/if}

	{#if isInitialLoad}
		<div class="h-6">
			<Progress />
		</div>
	{:else}
		<Boundary {children} />
	{/if}

	{#if description}
		<p class="text-subtle-2 mt-auto text-xs">{@render description()}</p>
	{/if}
</section>
