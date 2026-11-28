<script lang="ts">
	import type { GuestLayout } from '@viamrobotics/post-message-sdk/host'

	import { Section } from '#lib/components/Section/index.js'
	import {
		claimSectionHostScope,
		createSectionScope,
		provideSectionScope,
	} from '#lib/components/Section/section-scope-context.svelte.js'
	import { type Snippet, untrack } from 'svelte'

	import ControlFrame from './ControlFrame.svelte'

	interface Props {
		partID: string
		resourceName: string
		html: string
		loading?: Snippet
		error?: Snippet<[{ failure: Error; reset: () => void }]>
		/**
		 * Receives the guest's stated layout once per connect, bounded: `minWidth` is capped at 320,
		 * and each ideal is at least its minimum. Never called for a guest that states no layout.
		 * The frame applies the bounded minimums as its own `min-width` and `min-height`.
		 *
		 * A guest that never reports a size keeps the frame at its 160 px class height.
		 */
		onLayout?: (layout: GuestLayout) => void
	}

	const { partID, resourceName, html, loading, error, onLayout }: Props = $props()

	const toError = (thrown: unknown) =>
		thrown instanceof Error ? thrown : new Error(String(thrown))

	// Inside a host's scope the host's header carries the indicator. Bare, the widget scopes itself.
	const hostScope = claimSectionHostScope()
	const getOwnSources = () => ({})
	if (hostScope === undefined) provideSectionScope(createSectionScope(getOwnSources))

	$effect(() => {
		// Registering writes the scope's contributors, so it must not subscribe this effect to them.
		return untrack(() => hostScope?.register(getOwnSources))
	})
</script>

{#if hostScope === undefined}
	<div class="flex justify-end px-2 py-1">
		<Section.Errors />
	</div>
{/if}

{#key html}
	<svelte:boundary>
		<ControlFrame
			{partID}
			{resourceName}
			{html}
			{loading}
			{onLayout}
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
					<!-- Reports into the section's indicator and draws nothing, so the box stays empty. -->
					<Section.Error error={failure} />
				{/if}
			</div>
		{/snippet}
	</svelte:boundary>
{/key}
