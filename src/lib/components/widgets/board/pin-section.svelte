<script lang="ts">
	import type { Snippet } from 'svelte'

	import { twMerge } from 'tailwind-merge'

	interface Props {
		title: string
		class?: string
		children?: Snippet
	}

	const { title, class: className, children }: Props = $props()

	const headingID = $props.id()
</script>

<section
	class={twMerge('border-light w-full max-w-50 gap-6 divide-y border', className)}
	aria-labelledby={headingID}
>
	<h4
		id={headingID}
		class="bg-light font-roboto-mono text-subtle-1 px-3 py-1.25 text-center text-sm uppercase"
	>
		{title}
	</h4>
	{@render children?.()}
</section>
