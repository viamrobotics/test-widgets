<script lang="ts">
	import * as Sentry from '@sentry/svelte'

	const { children } = $props()

	let isErrorExpanded = $state(false)

	const describeError = (error: unknown) => {
		return error instanceof Error ? (error.stack ?? error.message) : String(error)
	}
</script>

<svelte:boundary
	onerror={(error) => {
		Sentry.captureException(error)
	}}
>
	{@render children?.()}

	{#snippet failed(error, reset)}
		<div
			role="alert"
			class="bg-extralight flex h-full w-full flex-col items-center justify-center gap-2 p-4"
		>
			<div>Something went wrong</div>
			<button
				class="text-subtle-1 text-xs hover:underline"
				type="button"
				onclick={() => {
					isErrorExpanded = false
					reset()
				}}
			>
				Try again
			</button>
			<button
				class="text-danger-dark text-xs hover:underline"
				type="button"
				aria-expanded={isErrorExpanded}
				onclick={() => {
					isErrorExpanded = !isErrorExpanded
				}}
			>
				{isErrorExpanded ? 'Hide' : 'Show'} error
			</button>
			{#if isErrorExpanded}
				<pre class="text-danger-dark font-mono text-xs text-wrap">{describeError(error)}</pre>
			{/if}
		</div>
	{/snippet}
</svelte:boundary>
