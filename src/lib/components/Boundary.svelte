<script lang="ts">
	import * as Sentry from '@sentry/svelte'

	const { children } = $props()

	let isErrorExpanded = $state(false)

	const describeError = (error: unknown) => {
		const message = String(error)
		const stack = error instanceof Error ? error.stack : undefined
		if (stack === undefined) return message

		// A Chromium stack opens with the message. A Firefox or Safari stack holds only the call frames.
		return stack.startsWith(message) ? stack : `${message}\n${stack}`
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
