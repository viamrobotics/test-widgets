<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLAttributes } from 'svelte/elements'

	interface Props extends HTMLAttributes<HTMLDivElement> {
		children: Snippet
		aside?: Snippet
	}

	const { children, aside, class: className, ...rest }: Props = $props()
</script>

<div
	class={['flex flex-row items-center gap-1', className]}
	{...rest}
>
	<h3 class="flex flex-row items-center gap-1 text-sm font-semibold">
		{@render children()}
	</h3>
	{@render aside?.()}
</div>
