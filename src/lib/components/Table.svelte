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

<style>
	.customTable {
		width: 100%;
		table-layout: auto;
	}
	.customTable :global(thead) {
		border: 1px solid #e4e4e6;
		background-color: #f7f7f8;
	}
	.customTable :global(thead th) {
		border: 1px solid #e4e4e6;
		color: #4e4f52;
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		line-height: 1rem;
		font-weight: 400;
		white-space: nowrap;
	}
	.customTable :global(thead th abbr) {
		color: #9c9ca4;
	}
	.customTable :global(tbody) {
		border: 1px solid #e4e4e6;
	}
	.customTable :global(tbody th) {
		border: 1px solid #e4e4e6;
		font-family: 'Roboto Mono Variable', 'Roboto Mono', ui-monospace, monospace;
		color: #282829;
		height: 2.5rem;
		gap: 0.5rem;
		padding-left: 0.375rem;
		padding-right: 0.375rem;
		text-align: center;
		font-size: 0.75rem;
		line-height: 1rem;
		font-weight: 400;
	}
</style>
