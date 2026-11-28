<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { ClassValue } from 'svelte/elements'

	interface Props {
		title: Snippet
		class?: ClassValue
		children?: Snippet
	}

	const { title, class: className, children }: Props = $props()

	const headingID = $props.id()
</script>

<section
	class={['border-light w-full max-w-50 gap-6 divide-y border', className]}
	aria-labelledby={headingID}
>
	<h4
		id={headingID}
		class="bg-light font-roboto-mono text-subtle-1 px-3 py-1.25 text-center text-sm uppercase"
	>
		{@render title()}
	</h4>
	{@render children?.()}
</section>
