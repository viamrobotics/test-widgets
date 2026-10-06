<script lang="ts">
	import type { QueryObserverResult } from '@tanstack/svelte-query'
	import type { Snippet } from 'svelte'
	import type { ClassValue } from 'svelte/elements'

	import { useResizeObserver } from 'runed'

	import ContentRect from './content-rect.svelte'
	import ErrorDisplay from './error.svelte'
	import Progress from './progress.svelte'

	interface Props {
		queries: QueryObserverResult[]
		class?: ClassValue
		children?: Snippet<[{ data: unknown[] }]>
	}

	const { queries, class: classNames, children }: Props = $props()

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

	const errorKey = (error: Error) => `${error.name}\0${error.message}`
	const serializeErrors = (errs: Error[]) => errs.map((element) => errorKey(element)).join('\0\0')
	const dedupeErrors = (errs: Error[]) => [
		...new Map(errs.map((error) => [errorKey(error), error])).values(),
	]

	// Errors are null during loading, so keep the latest errors during polling.
	// Only update errors if the content has changed to avoid re-rendering identical errors.
	$effect.pre(() => {
		const nextErrors = dedupeErrors(
			queries.map((query) => query.error).filter((error) => error !== null)
		)
		if (nextErrors.length > 0) {
			if (serializeErrors(nextErrors) !== serializeErrors(errors)) {
				errors = nextErrors
			}
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
	// A caller's class sets the placeholder height, so it replaces ContentRect's default `h-full`.
	const contentRectClass = $derived(['w-full', classNames ?? 'h-full'])
</script>

{#if errors.length > 0}
	<ContentRect
		{contentRect}
		class={contentRectClass}
	>
		{#each errors as error (errorKey(error))}
			<ErrorDisplay lastError={error} />
		{/each}
	</ContentRect>
{:else if isLoading}
	<ContentRect
		{contentRect}
		class={contentRectClass}
	>
		<Progress />
	</ContentRect>
{:else}
	<div bind:this={el}>
		{@render children?.({ data })}
	</div>
{/if}
