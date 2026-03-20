<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLAttributes } from 'svelte/elements'

	import { Icon, Tooltip } from '@viamrobotics/prime-core'
	import { twMerge } from 'tailwind-merge'

	interface Props extends HTMLAttributes<HTMLElement> {
		title?: string | undefined
		tooltip?: string | undefined
		description?: string | undefined
		bottomText?: string | undefined
		class?: string
		children?: Snippet
	}

	const {
		title,
		tooltip,
		description,
		bottomText,
		class: className = '',
		children,
		...rest
	}: Props = $props()

	const headingID = $props.id()
</script>

<section
	class={twMerge('flex grow flex-col gap-4 p-4', className)}
	aria-labelledby={headingID}
	{...rest}
>
	{#if title}
		<div class="flex flex-col gap-0.5">
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
		</div>
	{/if}

	{@render children?.()}

	{#if bottomText}
		<p class="text-subtle-2 mt-auto text-xs">{bottomText}</p>
	{/if}
</section>
