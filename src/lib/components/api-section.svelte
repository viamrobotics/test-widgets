<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { ClassValue, HTMLAttributes } from 'svelte/elements'

	import type { ResourceTriplet } from '$lib/resource-triplet'

	import Boundary from './boundary.svelte'
	import SectionTitle from './section-title.svelte'

	interface Props extends HTMLAttributes<HTMLElement> {
		title?: string | undefined
		tooltip?: string | undefined
		description?: string | undefined
		bottomText?: string | undefined
		/** RDK API string; presence renders the title as a linked monospace method name */
		api?: ResourceTriplet | undefined
		class?: ClassValue
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
	class={['flex p-4', className]}
	aria-labelledby={title ? headingID : undefined}
	{...rest}
>
	{#if title}
		<div class="flex flex-col gap-0.5">
			{#if api}
				<SectionTitle
					{title}
					{tooltip}
					{api}
					headingId={headingID}
				/>
			{:else}
				<h3
					class="flex flex-row items-center gap-1 text-sm font-semibold"
					id={headingID}
				>
					{title}
				</h3>
			{/if}
			{#if description}
				<p class="text-subtle-2 text-xs">{description}</p>
			{/if}
		</div>
	{/if}

	<Boundary {children} />

	{#if bottomText}
		<p class="text-subtle-2 text-xs">{bottomText}</p>
	{/if}
</section>
