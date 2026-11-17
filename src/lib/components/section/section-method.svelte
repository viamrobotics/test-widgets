<script lang="ts">
	import type { ResourceTriplet } from '$lib/resource-triplet'

	import { apiDocsHref } from '$lib/api-docs-href'

	import { useSectionScope } from './section-scope-context.svelte'

	interface Props {
		/**
		 * RDK method name in PascalCase. Leave it out to read the enclosing `Section.Scope`'s method.
		 * Passing it with `api` renders the name as a link to its docs, as sections before
		 * `Section.Docs` did.
		 */
		method?: string
		api?: ResourceTriplet
	}

	const { method, api }: Props = $props()

	const scope = useSectionScope()

	const name = $derived(method ?? scope?.method)

	// Method names are the camelCase form of the PascalCase heading (GetPosition → getPosition).
	const href = $derived(
		method && api ? apiDocsHref(api, method.charAt(0).toLowerCase() + method.slice(1)) : undefined
	)
</script>

{#if href}
	<a
		{href}
		target="_blank"
		rel="noopener noreferrer external"
		class="decoration-gray-5 hover:decoration-default font-mono underline underline-offset-3"
	>
		{name}
	</a>
{:else if name}
	<span class="font-mono">{name}</span>
{/if}
