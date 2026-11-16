<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Section } from '$lib/components/section'

	import ControlFrame from './control-frame.svelte'

	interface Props {
		partID: string
		resourceName: string
		html: string
		loading?: Snippet
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
					<Section.Error error={failure} />
				{/if}
			</div>
		{/snippet}
	</svelte:boundary>
{/key}
