<script lang="ts">
	import type { Snippet } from 'svelte'

	import { twMerge } from 'tailwind-merge'

	import ErrorDisplay from './error.svelte'
	import SectionTitle from './section-title.svelte'

	interface Props {
		title: string
		tooltip?: string | undefined
		description?: string | undefined
		lastError: Error | null
		/** camelCase method name; presence → monospace title */
		method?: string | undefined
		/** docs URL; presence → underline + link (requires method) */
		href?: string | undefined
		class?: string
		titleInput?: Snippet
		error?: Snippet
		children?: Snippet
	}

	const {
		title,
		tooltip,
		description,
		lastError = null,
		method,
		href,
		class: className,
		titleInput,
		error,
		children,
	}: Props = $props()

	const headingID = $props.id()
</script>

<section
	class="flex w-full flex-col gap-2 p-4"
	aria-labelledby={headingID}
>
	<div class={twMerge('flex grow flex-row flex-wrap gap-2', className)}>
		<div class="flex max-w-[200px] grow flex-col gap-0.5 pr-4">
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
			{@render titleInput?.()}
		</div>

		<div class="flex grow flex-wrap justify-between gap-2">
			{@render children?.()}
		</div>
	</div>
	{#if error}
		{@render error()}
	{:else}
		<ErrorDisplay {lastError} />
	{/if}
</section>
