<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { ClassValue } from 'svelte/elements'

	interface Props {
		contentRect: DOMRect | undefined
		class?: ClassValue
		children?: Snippet
	}

	const { contentRect, class: classNames = '', children }: Props = $props()
</script>

<div
	class={['h-full w-full', classNames]}
	style:width={contentRect ? `${contentRect.width.toString()}px` : undefined}
	style:height={contentRect ? `${contentRect.height.toString()}px` : undefined}
>
	{@render children?.()}
</div>
