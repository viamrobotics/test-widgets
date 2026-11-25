<!--
@component
One pin read: a labeled readout and its `Get`. The children are the value.
-->
<script lang="ts">
	import type { Snippet } from 'svelte'

	import ConfirmingButton from './confirming-button.svelte'

	interface Props {
		label: string
		unit?: string
		onGet: () => Promise<boolean>
		children: Snippet
	}

	const { label, unit, onGet, children }: Props = $props()

	const labelId = $props.id()
</script>

<div
	role="group"
	aria-labelledby={labelId}
	class="flex flex-wrap items-center gap-x-2 gap-y-1"
>
	<div class="flex min-w-37.5 flex-1 items-center gap-1">
		<span
			id={labelId}
			class="text-subtle-1 shrink-0 text-xs"
		>
			{label}
		</span>
		<!-- The unit sits inside the output so the announced value carries it. -->
		<output class="readout font-roboto-mono">
			<span class="readout-value inline-flex items-center gap-2">{@render children()}</span>
			{#if unit}
				<span class="readout-suffix">{unit}</span>
			{/if}
		</output>
	</div>
	<ConfirmingButton
		verb="Get"
		onclick={onGet}
	/>
</div>
