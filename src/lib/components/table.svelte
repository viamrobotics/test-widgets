<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children?: Snippet
	}

	const { children }: Props = $props()
</script>

<table class="customTable">
	{@render children?.()}
</table>

<style lang="postcss">
	/* 
    NOTE(zp, 2024-06-10) Admittedly, this is a bit dangerous; 
    However, it does let us use standard html <table> tags like tr, th and tbody which has ergonomic advantages

    If this is giving us trouble, please feel no hesitation about deleting this
  */

	/* (:global is a svelte directive specifically for this purpose with slots.)*/

	@reference "../../app.css";

	.customTable {
		@apply w-full table-auto;
	}
	.customTable :global(thead) {
		@apply border-light bg-light border;
	}
	.customTable :global(thead th) {
		@apply border-light text-subtle-1 border px-2.5 py-1 text-xs font-normal whitespace-nowrap;
	}
	.customTable :global(thead th abbr) {
		@apply text-disabled;
	}

	.customTable :global(tbody) {
		@apply border-light border;
	}
	.customTable :global(tbody th) {
		@apply border-light font-roboto-mono text-default h-10 gap-2 border px-1.5 text-center text-xs font-normal;
	}
</style>
