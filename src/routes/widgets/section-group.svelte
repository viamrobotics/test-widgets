<!--
@component

A group of sections in a card. For example, "test" or "do command"
-->
<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Icon } from '@viamrobotics/prime-core'
	import { slide } from 'svelte/transition'

	interface Props {
		/** Title for the group. */
		title: Snippet
		/** Collapsed state. */
		isCollapsed: boolean
		/** Toggle collapsed state. */
		toggleIsCollapsed: () => void
		children?: Snippet
	}

	const { title, isCollapsed, toggleIsCollapsed, children }: Props = $props()

	const id = $props.id()
	const collapseID = `section-group-collapse-${id}`
	const headingID = `section-group-heading-${id}`
	const toggleLabelID = `section-group-toggle-label-${id}`
</script>

<section
	class="flex flex-col"
	aria-labelledby={headingID}
>
	<header class={['border-gray-3 bg-light hover:bg-medium h-7', !isCollapsed && 'border-b']}>
		<button
			class="group flex h-full w-full flex-row items-center gap-2 px-2.75"
			aria-controls={collapseID}
			aria-expanded={!isCollapsed}
			aria-labelledby={`${toggleLabelID} ${headingID}`}
			onclick={toggleIsCollapsed}
		>
			<Icon
				name={isCollapsed ? 'unfold-more-horizontal' : 'unfold-less-horizontal'}
				cx="group-hover:text-gray-7 text-[#AEAEB5]"
			/>

			<span
				id={toggleLabelID}
				class="sr-only"
			>
				{isCollapsed ? 'expand' : 'collapse'}
			</span>
			<h2
				id={headingID}
				class="font-roboto-mono text-subtle-2 m-0 text-left text-xs tracking-[0.06em] uppercase"
			>
				{@render title()}
			</h2>
		</button>
	</header>
	{#if !isCollapsed}
		<div
			id={collapseID}
			role="region"
			class="divide-y"
			transition:slide={{ duration: 150 }}
		>
			{@render children?.()}
		</div>
	{/if}
</section>
