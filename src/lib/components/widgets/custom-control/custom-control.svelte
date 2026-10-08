<script lang="ts">
	import type { Snippet } from 'svelte'

	import ErrorDisplay from '$lib/components/error.svelte'

	import ControlFrame from './control-frame.svelte'

	interface Props {
		partID: string
		resourceName: string
		/** The prebuilt control artifact. The widget injects the host's policy before rendering it. */
		html: string
		/** Shown over the iframe until the guest reports its first size. */
		loading?: Snippet
		/** Replaces the default error display. `reset` renders the control again. */
		error?: Snippet<[{ failure: Error; reset: () => void }]>
	}

	const { partID, resourceName, html, loading, error }: Props = $props()

	const toError = (thrown: unknown) =>
		thrown instanceof Error ? thrown : new Error(String(thrown))
</script>

{#key html}
	<svelte:boundary>
		<ControlFrame
			{partID}
			{resourceName}
			{html}
			{loading}
		/>

		{#snippet failed(thrown, reset)}
			{@const failure = toError(thrown)}
			<div
				role="alert"
				class="bg-extralight flex min-h-40 w-full items-center justify-center p-4"
			>
				{#if error}
					{@render error({ failure, reset })}
				{:else}
					<ErrorDisplay lastError={failure} />
				{/if}
			</div>
		{/snippet}
	</svelte:boundary>
{/key}
