<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLAttributes } from 'svelte/elements'

	interface Props extends HTMLAttributes<HTMLParagraphElement> {
		children: Snippet
	}

	const { children, class: className, ...rest }: Props = $props()
</script>

<p
	class={['text-subtle-2 text-xs', className]}
	{...rest}
>
	{@render children()}
</p>
