<script lang="ts">
	import type { QueryObserverResult } from '@tanstack/svelte-query'
	import type { Snippet } from 'svelte'

	import { useResizeObserver } from 'runed'

	import ContentRect from './content-rect.svelte'
	import ErrorDisplay from './error.svelte'
	import Progress from './progress.svelte'

	interface Props {
		queries: QueryObserverResult[]
		contentCx?: string
		children?: Snippet<[{ data: unknown[] }]>
	}

	const { queries, contentCx = '', children }: Props = $props()

	let el = $state.raw<HTMLDivElement>()
	let contentRect = $state.raw<DOMRect>()

	useResizeObserver(
		() => el,
		([entry]) => {
			contentRect = entry.contentRect
		}
	)

	let errors = $state.raw<Error[]>([])
	let data = $state.raw<unknown[]>([])

	// Errors are null during loading, so keep the latest errors during polling.
	$effect.pre(() => {
		const nextErrors = queries.map((query) => query.error).filter((error) => error !== null)
		if (nextErrors.length > 0) {
			errors = nextErrors
		} else if (queries.every((query) => query.isSuccess)) {
			errors = []
		}
	})

	// Data is undefined during loading, so keep the latest data during polling.
	$effect.pre(() => {
		const nextData = queries.map((query) => query.data)
		if (nextData.length > 0) {
			data = nextData
		}
	})

	const isLoading = $derived(queries.some((query) => query.isLoading))
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
		<Progress />
	</ContentRect>
{:else}
	<div
		class="w-full"
		bind:this={el}
	>
		{@render children?.({ data })}
	</div>
{/if}
