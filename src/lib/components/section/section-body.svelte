<script lang="ts">
	import type { Snippet } from 'svelte'

	import Boundary from '../boundary.svelte'
	import Progress from '../progress.svelte'
	import { provideSectionLoading } from './section-loading'

	interface Props {
		children: Snippet
		isLoading?: boolean
		/**
		 * @deprecated Exists only for the migration. Once every section passes it, skeleton becomes
		 * the only behavior and this prop and the progress-bar swap are removed.
		 */
		skeleton?: boolean
	}

	const { isLoading = false, skeleton = false, children }: Props = $props()

	provideSectionLoading(() => skeleton && isLoading)
</script>

{#if skeleton}
	<div
		class="contents"
		aria-busy={isLoading}
	>
		<Boundary {children} />
	</div>
{:else if isLoading}
	<div class="h-6">
		<Progress />
	</div>
{:else}
	<Boundary {children} />
{/if}
