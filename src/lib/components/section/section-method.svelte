<script lang="ts">
	import type { ResourceTriplet } from '$lib/resource-triplet'

	import { apiDocsHref } from '$lib/api-docs-href'

	interface Props {
		/** RDK method name in PascalCase. */
		method: string
		api: ResourceTriplet
	}

	const { method, api }: Props = $props()

	// Method names are the camelCase form of the PascalCase heading (GetPosition → getPosition).
	const href = $derived(apiDocsHref(api, method.charAt(0).toLowerCase() + method.slice(1)))
</script>

{#if href}
	<a
		{href}
		target="_blank"
		rel="noopener noreferrer external"
		class="decoration-gray-5 hover:decoration-default font-mono underline underline-offset-3"
	>
		{method}
	</a>
{:else}
	<span class="font-mono">{method}</span>
{/if}
