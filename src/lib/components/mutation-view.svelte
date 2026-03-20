<script lang="ts">
	import type { Snippet } from 'svelte';

	import ErrorDisplay from './error-display.svelte';

	interface Props {
		lastError: Error | null;

		titleInput?: Snippet;
		error?: Snippet;
		children: Snippet;
	}

	const { lastError, titleInput, error, children }: Props = $props();
</script>

<div class="flex flex-col gap-2">
	<span class="inline-flex flex-wrap gap-2">
		{@render titleInput?.()}
		<div class="flex grow flex-wrap justify-between gap-2">
			{@render children()}
		</div>
	</span>
	{#if error}
		{@render error()}
	{:else}
		<ErrorDisplay {lastError} />
	{/if}
</div>
