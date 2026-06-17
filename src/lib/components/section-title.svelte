<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Icon, Tooltip } from '@viamrobotics/prime-core'

	import { apiDocsHref } from '$lib/api-docs-href'

	interface Props {
		title: string
		tooltip?: string | undefined
		/** RDK API string, e.g. "rdk:component:camera". Presence renders the title as a monospace API-method name, linked to the docs when an anchor exists. */
		api?: string | undefined
		/** Optional external ID for the <h3>; generated internally if omitted */
		headingId?: string | undefined
		/** Inline content rendered after the title inside the <h3> (e.g. unit labels) */
		suffix?: Snippet
	}

	const { title, tooltip, api, headingId, suffix }: Props = $props()

	const generatedID = $props.id()
	const id = $derived(headingId ?? generatedID)

	// Method names are the camelCase form of the PascalCase title (GetPosition → getPosition).
	const method = $derived(title.charAt(0).toLowerCase() + title.slice(1))
	const href = $derived(api ? apiDocsHref(api, method) : undefined)
</script>

<h3
	class="flex flex-row items-center gap-1 text-sm font-semibold"
	{id}
>
	{#if href}
		<a
			{href}
			target="_blank"
			rel="noopener noreferrer external"
			class="decoration-gray-5 hover:decoration-default font-mono underline underline-offset-3"
		>
			{title}
		</a>
	{:else if api}
		<span class="font-mono">{title}</span>
	{:else}
		{title}
	{/if}
	{#if suffix}
		{@render suffix()}
	{/if}
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
				{tooltip}
			</p>
		</Tooltip>
	{/if}
</h3>
