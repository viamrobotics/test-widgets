<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		label: string
		/** The formatted value. A reading that has not arrived draws a dash. */
		value: string | undefined
		/** The unit and any other `readout-suffix` elements, drawn after the value. */
		children?: Snippet
	}

	const { label, value, children }: Props = $props()

	const MISSING_VALUE = '-'

	const labelId = $props.id()
</script>

<div class="flex min-w-0 items-center gap-2">
	<span
		id={labelId}
		class="text-subtle-1 w-14 shrink-0 text-xs"
	>
		{label}
	</span>
	<span
		role="group"
		aria-labelledby={labelId}
		class="readout font-roboto-mono"
	>
		<span class="readout-value">{value ?? MISSING_VALUE}</span>
		{@render children?.()}
	</span>
</div>
