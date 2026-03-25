<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Icon, Tooltip } from '@viamrobotics/prime-core'
	import { twMerge } from 'tailwind-merge'

	import ErrorDisplay from './error.svelte'

	interface Props {
		title: string
		tooltip?: string | undefined
		description?: string | undefined
		lastError: Error | null
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
		class: className,
		titleInput,
		error,
		children,
	}: Props = $props()

	const headingID = $props.id()
</script>

<section
	class="flex flex-col gap-2 p-4"
	aria-labelledby={headingID}
>
	<div class={twMerge('flex grow flex-row flex-wrap gap-2', className)}>
		<div class="flex max-w-[200px] grow flex-col gap-0.5 pr-4">
			<h3
				class="flex flex-row items-center gap-1 text-sm font-semibold"
				id={headingID}
			>
				{title}
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
