<script lang="ts">
	import type { Detection } from './context.svelte.ts'

	import { useDetections } from './context.svelte.ts'

	interface Props {
		detection: Detection
		label: string
	}

	let { detection, label }: Props = $props()

	const context = useDetections()

	let node: HTMLElement | undefined

	$effect(() => {
		if (context.selected === detection.id && node) {
			node.scrollIntoView({ block: 'nearest' })
		}
	})
</script>

<button
	bind:this={node}
	class={[
		'hover:bg-light w-full py-1 pl-11 text-left',
		(context.hovered.has(detection.id) || context.selected === detection.id) && 'bg-light',
	]}
	onpointerenter={() => context.hovered.add(detection.id)}
	onpointerleave={() => context.hovered.delete(detection.id)}
	onclick={() => {
		context.selected = context.selected === detection.id ? null : detection.id
	}}
>
	{label}
	<span class="text-subtle-2 pl-1">{detection.confidence}%</span>
</button>
