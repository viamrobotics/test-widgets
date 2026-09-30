<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Progress } from '@viamrobotics/prime-core'

	interface Props {
		children?: Snippet
	}

	const { children }: Props = $props()

	let isErrorExpanded = $state(false)
</script>

<svelte:boundary>
	{#snippet pending()}
		<Progress />
	{/snippet}

	{@render children?.()}

	{#snippet failed(error, reset)}
		<div class="bg-extralight flex h-full w-full flex-col items-center justify-center gap-2 p-4">
			<div>Something went wrong</div>
			<button
				class="text-disabled text-xs hover:underline"
				onclick={reset}>Try again</button
			>
			<button
				class="text-disabled text-xs hover:underline"
				aria-expanded={isErrorExpanded}
				onclick={() => {
					isErrorExpanded = !isErrorExpanded
				}}>{isErrorExpanded ? 'Hide' : 'Show'} error</button
			>
			{#if isErrorExpanded}
				<pre class="font-mono text-xs text-wrap">{error}</pre>
			{/if}
		</div>
	{/snippet}
</svelte:boundary>
