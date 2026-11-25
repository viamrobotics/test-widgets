<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children?: Snippet
	}

	const { children }: Props = $props()
</script>

<!-- 
  @component Represents a keyboard key.
-->
<span class="text-default rounded-sm bg-gray-200 px-1 py-0.5 font-semibold">
	{@render children?.()}
</span>
