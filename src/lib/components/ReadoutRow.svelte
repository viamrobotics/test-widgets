<!--
@component
One labelled readout: the label in a fixed column, then the value in a readout box, named by the
label for a screen reader. A value that is `undefined` reads as a dash with no unit.

```svelte
<ReadoutRow label="Sample rate" value={String(sampleRateHz)} suffix="Hz" />
```
-->
<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		label: string
		/** `undefined` while there is no value to show. */
		value: string | undefined
		/** The unit, drawn after a value. */
		suffix?: string
		/** Placed after the readout, such as a copy button. */
		children?: Snippet
	}

	const { label, value, suffix, children }: Props = $props()

	const MISSING_VALUE = '-'

	const labelId = $props.id()
</script>

<div class="flex min-w-0 items-center gap-2">
	<span
		id={labelId}
		class="text-subtle-1 w-31 shrink-0 truncate text-xs"
	>
		{label}
	</span>
	<span
		role="group"
		aria-labelledby={labelId}
		class="readout font-roboto-mono min-w-0 truncate"
	>
		<span class="readout-value">{value ?? MISSING_VALUE}</span>
		{#if suffix !== undefined && value !== undefined}
			<span class="readout-suffix">{suffix}</span>
		{/if}
	</span>
	{@render children?.()}
</div>
