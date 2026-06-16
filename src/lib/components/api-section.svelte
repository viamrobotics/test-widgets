<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLAttributes } from 'svelte/elements'

	import { twMerge } from 'tailwind-merge'

	import SectionTitle from './section-title.svelte'

	interface Props extends HTMLAttributes<HTMLElement> {
		title?: string | undefined
		tooltip?: string | undefined
		description?: string | undefined
		bottomText?: string | undefined
		/** camelCase method name; presence → monospace title */
		method?: string | undefined
		/** docs URL; presence → underline + link (requires method) */
		href?: string | undefined
		class?: string
		children?: Snippet
	}

	const {
		title,
		tooltip,
		description,
		bottomText,
		method,
		href,
		class: className = '',
		children,
		...rest
	}: Props = $props()

	const headingID = $props.id()
</script>

<section
	class={twMerge('flex grow flex-col gap-4 p-4', className)}
	aria-labelledby={title ? headingID : undefined}
	{...rest}
>
	{#if title}
		<div class="flex flex-col gap-0.5">
			<SectionTitle
				{title}
				{tooltip}
				{method}
				{href}
				headingId={headingID}
			/>
			{#if description}
				<p class="text-subtle-2 text-xs">{description}</p>
			{/if}
		</div>
	{/if}

	{@render children?.()}

	{#if bottomText}
		<p class="text-subtle-2 mt-auto text-xs">{bottomText}</p>
	{/if}
</section>
