<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLAttributes } from 'svelte/elements'

	interface Props extends HTMLAttributes<HTMLElement> {
		children: Snippet
	}

	const { children, class: className, ...rest }: Props = $props()
</script>

<section
	class={['flex p-4', className]}
	{...rest}
>
	{@render children()}
</section>
