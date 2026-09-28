<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLAttributes } from 'svelte/elements'

	import { Icon, Tooltip } from '@viamrobotics/prime-core'

	import type { ResourceTriplet } from '$lib/resource-triplet'

	import { apiDocsHref } from '$lib/api-docs-href'

	interface Props extends HTMLAttributes<HTMLElement> {
		/** RDK method name in PascalCase, rendered verbatim in mono. With `api`, it links to the docs. */
		method?: string | undefined
		/** RDK API string, e.g. "rdk:component:camera". The docs link is built from it and `method`. */
		api?: ResourceTriplet | undefined
		/** Heading content for a section that is not one method. Ignored when `method` is set. */
		heading?: Snippet
		tooltip?: Snippet
		/** Inline content rendered after the heading text inside the h3, e.g. unit labels. */
		suffix?: Snippet
		/** Content beside the heading, outside its accessible name, e.g. the error indicator. */
		aside?: Snippet
	}

	const { method, api, heading, tooltip, suffix, aside }: Props = $props()

	// Method names are the camelCase form of the PascalCase heading (GetPosition → getPosition).
	const href = $derived(
		method && api ? apiDocsHref(api, method.charAt(0).toLowerCase() + method.slice(1)) : undefined
	)
</script>

<div class="flex flex-row items-center gap-1">
	<h3 class="flex flex-row items-center gap-1 text-sm font-semibold">
		{#if method}
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
		{:else}
			{@render heading?.()}
		{/if}
		{@render suffix?.()}
	</h3>
	{#if tooltip}
		<Tooltip>
			<Icon
				name="information-outline"
				cx="text-gray-6"
			/>

			<p
				slot="description"
				class="text-xs whitespace-pre-line"
			>
				{@render tooltip()}
			</p>
		</Tooltip>
	{/if}
	{@render aside?.()}
</div>
