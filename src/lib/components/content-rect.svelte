<script lang="ts">
	import type { Snippet } from 'svelte'

	import { twMerge } from 'tailwind-merge'

	interface Props {
		contentRect: DOMRect | undefined
		cx?: string
		children?: Snippet
	}

	const { contentRect, cx = '', children }: Props = $props()
</script>

<div
	class={twMerge('h-full w-full', cx)}
	style:width={contentRect ? `${contentRect.width.toString()}px` : undefined}
	style:height={contentRect ? `${contentRect.height.toString()}px` : undefined}
>
	{@render children?.()}
</div>
