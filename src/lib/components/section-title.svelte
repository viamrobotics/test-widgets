<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Icon, Tooltip } from '@viamrobotics/prime-core'

	interface Props {
		title: string
		tooltip?: string | undefined
		/** camelCase method name; presence → monospace rendering */
		method?: string | undefined
		/** presence → underline + external link (requires method) */
		href?: string | undefined
		/** Optional external ID for the <h3>; generated internally if omitted */
		headingId?: string | undefined
		/** Inline content rendered after the title inside the <h3> (e.g. unit labels) */
		suffix?: Snippet
	}

	const { title, tooltip, method, href, headingId, suffix }: Props = $props()

	const generatedID = $props.id()
	const id = $derived(headingId ?? generatedID)
</script>

<h3
	class="flex flex-row items-center gap-1 text-sm font-semibold"
	{id}
>
	{#if href && method}
		<a
			{href}
			target="_blank"
			rel="noopener noreferrer external"
			class="decoration-gray-5 hover:decoration-default font-mono underline underline-offset-3"
		>
			{title}
		</a>
	{:else if method}
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
