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
		/** RDK API string; presence renders the title as a linked monospace method name */
		api?: string | undefined
		class?: string
		children?: Snippet
	}

	const {
		title,
		tooltip,
		description,
		bottomText,
		api,
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
				{api}
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
