<script lang="ts">
	import type { Snippet } from 'svelte'

	import { provideSectionErrorReporter } from '$lib/components/section/section-error-reporter'

	interface Props {
		children: Snippet
	}

	const { children }: Props = $props()

	// Errors below show inline where they occur, such as on the feed's overlay, and not in the section's indicator.
	provideSectionErrorReporter(() => undefined)
</script>

{@render children()}
