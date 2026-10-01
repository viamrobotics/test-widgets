<script lang="ts">
	import type { Snippet } from 'svelte'

	import Boundary from '../boundary.svelte'
	import Progress from '../progress.svelte'

	interface Props {
		children: Snippet
		/** Shows a progress bar in place of the content, e.g. while a section's first query loads. */
		isLoading?: boolean
	}

	const { isLoading = false, children }: Props = $props()
</script>

{#if isLoading}
	<div class="h-6">
		<Progress />
	</div>
{:else}
	<Boundary {children} />
{/if}
