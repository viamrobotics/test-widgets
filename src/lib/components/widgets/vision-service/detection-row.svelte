<script lang="ts">
	import type { Snippet } from 'svelte'

	import type { Detection } from './context.svelte.ts'

	import { useDetections } from './context.svelte.ts'

	interface Props {
		detection: Detection
		label: Snippet
	}

	let { detection, label }: Props = $props()

	const context = useDetections()

	let node: HTMLElement | undefined

	const isSelected = $derived(context.selected === detection.id)

	$effect(() => {
		if (isSelected && node) {
			node.scrollIntoView({ block: 'nearest' })
		}
	})
</script>

<button
	bind:this={node}
	type="button"
	aria-pressed={isSelected}
	class={[
		'button button-ghost button-compact w-full justify-start',
		(context.hovered.has(detection.id) || isSelected) && 'bg-light',
	]}
	onpointerenter={() => context.hovered.add(detection.id)}
	onpointerleave={() => context.hovered.delete(detection.id)}
	onclick={() => {
		context.selected = isSelected ? null : detection.id
	}}
>
	{@render label()}
	<span class="text-subtle-2">{detection.confidence}%</span>
</button>
