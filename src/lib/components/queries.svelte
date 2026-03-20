<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ResizeDetail } from '@svelte-put/resize';
	import { resize } from '@svelte-put/resize';
	import type { QueryObserverResult } from '@tanstack/svelte-query';

	import ContentRect from './content-rect.svelte';
	import ErrorDisplay from './error-display.svelte';
	import LoadingDisplay from './loading-display.svelte';

	interface Props {
		queries: QueryObserverResult[];
		contentCx?: string;
		children?: Snippet<[{ data: unknown[] }]>;
	}

	const { queries, contentCx = '', children }: Props = $props();

	let contentRect = $state<DOMRect>();
	const handleResize = (event: CustomEvent<ResizeDetail>) => {
		contentRect = event.detail.entry.contentRect;
	};

	let errors = $state.raw<Error[]>([]);
	let data = $state.raw<unknown[]>([]);

	// Errors are null during loading, so keep the latest errors during polling.
	$effect.pre(() => {
		const nextErrors = queries.map((query) => query.error).filter((error) => error !== null);
		if (nextErrors.length > 0) {
			errors = nextErrors;
		} else if (queries.every((query) => query.isSuccess)) {
			errors = [];
		}
	});

	// Data is undefined during loading, so keep the latest data during polling.
	$effect.pre(() => {
		const nextData = queries.map((query) => query.data);
		if (nextData.length > 0) {
			data = nextData;
		}
	});

	const isLoading = $derived(queries.some((query) => query.isLoading));
</script>

{#if errors.length > 0}
	<ContentRect
		{contentRect}
		cx={contentCx}
	>
		{#each errors as error (error)}
			<ErrorDisplay lastError={error} />
		{/each}
	</ContentRect>
{:else if isLoading}
	<ContentRect
		{contentRect}
		cx={contentCx}
	>
		<LoadingDisplay />
	</ContentRect>
{:else}
	<div
		class="w-full"
		use:resize
		onresized={handleResize}
	>
		{@render children?.({ data })}
	</div>
{/if}
